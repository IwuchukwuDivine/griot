import { WebClient } from "@slack/web-api";
import {
  activeChannels,
  channelMessagesSince,
  dueOpenTodos,
  insertMessage,
  listActiveWorkspaces,
  mostRecentChannel,
} from "@griot/db";
import type { TodoRow, WorkspaceRow } from "@griot/db";
import { formatDateInTz, midnightInTz, resolveTz, todayInTz } from "./dates.js";
import { getLlm } from "./llm/index.js";
import { logger } from "./logger.js";
import { DAILY_SUMMARY_SYSTEM_PROMPT } from "./prompts.js";

function clientFor(workspace: WorkspaceRow): WebClient {
  const token = workspace.bot_token ?? process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error(
      `No bot token for workspace ${workspace.workspace_id} and SLACK_BOT_TOKEN is unset`,
    );
  }
  return new WebClient(token);
}

/** Posts to Slack and logs the post to working memory, like every Griot reply. */
async function postAndLog(
  client: WebClient,
  workspaceId: string,
  channelId: string,
  text: string,
): Promise<void> {
  await client.chat.postMessage({ channel: channelId, text });
  await insertMessage({
    workspaceId,
    channelId,
    senderName: "Griot",
    text,
    isBot: true,
  });
}

/**
 * Evening cron: any channel with enough human activity in the last 24h gets
 * a summary. One workspace or channel failing never blocks the rest.
 */
export async function runDailySummary(): Promise<void> {
  const job = "daily_summary";
  for (const workspace of await listActiveWorkspaces()) {
    const workspaceId = workspace.workspace_id;
    try {
      const channels = await activeChannels(workspaceId, 5, 24);
      if (channels.length === 0) {
        logger.info({ workspaceId, job }, "no busy channels — skipping");
        continue;
      }
      const client = clientFor(workspace);
      for (const channelId of channels) {
        try {
          const messages = await channelMessagesSince(workspaceId, channelId, 24);
          const lines = messages
            .map(
              (m) => `${m.sender_name ?? m.sender_id ?? "unknown"}: ${m.text ?? ""}`,
            )
            .join("\n");
          const summary = await getLlm().complete({
            system: DAILY_SUMMARY_SYSTEM_PROMPT,
            prompt: lines,
            model: "smart",
          });
          await postAndLog(client, workspaceId, channelId, summary);
          logger.info({ workspaceId, channelId, job }, "posted daily summary");
        } catch (err) {
          logger.error(
            { err, workspaceId, channelId, job },
            "channel summary failed",
          );
        }
      }
    } catch (err) {
      logger.error({ err, workspaceId, job }, "workspace summary failed");
    }
  }
}

/**
 * Morning cron: reminds each channel of its todos due today or overdue.
 * Todos created before channel tracking fall back to the workspace's most
 * recently active channel. Posts nothing when nothing is due.
 */
export async function runDeadlineCheck(): Promise<void> {
  const job = "deadline_check";
  const tz = resolveTz();
  const todayStart = midnightInTz(todayInTz(tz).date, tz);
  if (!todayStart) {
    throw new Error(`Could not resolve midnight for timezone ${tz}`);
  }

  for (const workspace of await listActiveWorkspaces()) {
    const workspaceId = workspace.workspace_id;
    try {
      const due = await dueOpenTodos(workspaceId, todayStart);
      if (due.length === 0) {
        continue;
      }

      const byChannel = new Map<string, TodoRow[]>();
      let fallback: string | null | undefined;
      for (const todo of due) {
        let channelId = todo.channel_id;
        if (!channelId) {
          if (fallback === undefined) {
            fallback = await mostRecentChannel(workspaceId);
          }
          channelId = fallback;
        }
        if (!channelId) {
          logger.warn(
            { workspaceId, job, todoId: todo.id },
            "no channel to remind in — skipping todo",
          );
          continue;
        }
        const list = byChannel.get(channelId) ?? [];
        list.push(todo);
        byChannel.set(channelId, list);
      }

      const client = clientFor(workspace);
      for (const [channelId, todos] of byChannel) {
        const dueToday = todos.filter(
          (t) => t.deadline && t.deadline >= todayStart,
        );
        const overdue = todos.filter(
          (t) => t.deadline && t.deadline < todayStart,
        );
        const sections: string[] = [];
        if (dueToday.length > 0) {
          sections.push(
            `⏰ Due today:\n${dueToday
              .map((t) => `- ${t.task} — ${t.owner ?? "unassigned"}`)
              .join("\n")}`,
          );
        }
        if (overdue.length > 0) {
          sections.push(
            `🔴 Overdue:\n${overdue
              .map(
                (t) =>
                  `- ${t.task} — ${t.owner ?? "unassigned"} (was due ${formatDateInTz(t.deadline as Date, tz)})`,
              )
              .join("\n")}`,
          );
        }
        await postAndLog(client, workspaceId, channelId, sections.join("\n\n"));
        logger.info(
          {
            workspaceId,
            channelId,
            job,
            dueToday: dueToday.length,
            overdue: overdue.length,
          },
          "posted deadline reminders",
        );
      }
    } catch (err) {
      logger.error({ err, workspaceId, job }, "deadline check failed");
    }
  }
}
