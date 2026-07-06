import type { App } from "@slack/bolt";
import { CLASSIFY_SYSTEM_PROMPT, getLlm, parseIntent } from "@griot/agent";
import type { Intent } from "@griot/agent";
import { claimEvent, getWorkspace, insertMessage } from "@griot/db";
import {
  handleAnswer,
  handleDecision,
  handleForget,
  handleLearn,
  handleTodoAdd,
  handleTodoDone,
  handleTodoList,
  handleTodoUpdate,
} from "./handlers.js";
import type { HandlerContext } from "./handlers.js";
import { logger } from "./logger.js";
import { resolveMentions, resolveUserName } from "./users.js";

const NOT_SET_UP = "👋 I'm Griot, but this workspace isn't set up yet.";
const SOMETHING_WRONG =
  "Something went wrong on my side — try again in a moment.";

/** Shared by the Socket Mode (dev) and Lambda entrypoints so behavior is identical. */
export function registerListeners(app: App): void {
  // Working memory: log every channel message, thread replies included.
  // This listener never replies — mentions are handled below. No retry guard
  // here: the unique index on slack_event_id makes redelivered writes no-ops.
  app.event("message", async ({ event, body, context, client }) => {
    try {
      // Skip edits/joins/etc. (subtyped) and other bots; our own replies are
      // logged at say() time with is_bot=true.
      if (event.subtype !== undefined || event.bot_id !== undefined) {
        return;
      }
      const workspaceId = context.teamId ?? event.team;
      const workspace = workspaceId ? await getWorkspace(workspaceId) : null;
      if (!workspace || workspace.status !== "active") {
        return;
      }
      await insertMessage({
        workspaceId: workspace.workspace_id,
        channelId: event.channel,
        slackEventId: body.event_id,
        senderId: event.user,
        senderName: await resolveUserName(client, event.user),
        text: await resolveMentions(client, event.text ?? "", context.botUserId),
      });
    } catch (err) {
      logger.error({ err, eventTs: event.ts }, "failed to log channel message");
    }
  });

  app.event("app_mention", async ({ event, body, context, say, client }) => {
    // Slack retries delivery if we were slow to ack; don't reprocess.
    // Socket Mode surfaces retryNum here; the Lambda path guards on the
    // x-slack-retry-num header before Bolt ever runs.
    if (typeof context.retryNum === "number" && context.retryNum >= 1) {
      logger.info(
        {
          retryNum: context.retryNum,
          retryReason: context.retryReason,
          eventTs: event.ts,
        },
        "slack retry received — acking without reprocessing",
      );
      return;
    }

    const teamId = context.teamId ?? event.team;

    // Belt-and-braces: claim the event id before doing anything visible, so
    // a redelivery that slips past the retry guards can't reply twice.
    const eventId = body.event_id;
    if (teamId && eventId) {
      const claimed = await claimEvent(teamId, eventId);
      if (!claimed) {
        logger.info(
          { teamId, eventId },
          "event already claimed by an earlier delivery — skipping",
        );
        return;
      }
    }

    const workspace = teamId ? await getWorkspace(teamId) : null;

    if (!workspace || workspace.status !== "active") {
      logger.info({ teamId, found: workspace !== null }, "workspace not set up");
      await say(NOT_SET_UP);
      return;
    }

    const workspaceId = workspace.workspace_id;
    const channelId = event.channel;

    // Reply where the mention happened (thread if threaded) and log our own
    // words — conversation memory must include what the bot said.
    const reply = async (text: string): Promise<void> => {
      await say({ text, thread_ts: event.thread_ts });
      try {
        await insertMessage({
          workspaceId,
          channelId,
          senderId: context.botUserId ?? null,
          senderName: "Griot",
          text,
          isBot: true,
        });
      } catch (err) {
        logger.error({ err, channelId }, "failed to log bot reply");
      }
    };

    const ctx: HandlerContext = {
      workspaceId,
      channelId,
      senderName: event.user
        ? await resolveUserName(client, event.user)
        : "teammate",
      reply,
    };
    // Mentions become display names (the bot's own is dropped) so intent
    // classification and todo-owner extraction see who was actually named.
    const text = await resolveMentions(client, event.text, context.botUserId);

    try {
      await routeMention(ctx, text);
    } catch (err) {
      logger.error({ err, workspaceId, channelId }, "mention handling failed");
      try {
        await reply(SOMETHING_WRONG);
      } catch (replyErr) {
        logger.error(
          { err: replyErr, workspaceId, channelId },
          "failed to deliver error reply",
        );
      }
    }
  });

  app.error(async (error) => {
    logger.error({ err: error }, "unhandled bolt error");
  });
}

/**
 * Prefix shortcuts (learn / #decision / forget) route directly — order
 * matters; everything else goes through the fast-model classifier.
 */
async function routeMention(ctx: HandlerContext, text: string): Promise<void> {
  const learn = /^learn\s+/i.exec(text);
  if (learn) {
    logRoute(ctx, "LEARN", "prefix");
    await handleLearn(ctx, text.slice(learn[0].length));
    return;
  }

  if (/#decision/i.test(text)) {
    logRoute(ctx, "DECISION", "tag");
    await handleDecision(ctx, text.replace(/^#decision:?\s*/i, "").trim());
    return;
  }

  if (/^forget\b/i.test(text)) {
    logRoute(ctx, "FORGET", "prefix");
    await handleForget(ctx);
    return;
  }

  const intent = parseIntent(
    await getLlm().complete({
      system: CLASSIFY_SYSTEM_PROMPT,
      prompt: text,
      model: "fast",
    }),
  );
  logRoute(ctx, intent, "classifier");

  switch (intent) {
    case "DECISION":
      await handleDecision(ctx, text);
      break;
    case "TODO_ADD":
      await handleTodoAdd(ctx, text);
      break;
    case "TODO_UPDATE":
      await handleTodoUpdate(ctx, text);
      break;
    case "TODO_DONE":
      await handleTodoDone(ctx, text);
      break;
    case "TODO_LIST":
      await handleTodoList(ctx);
      break;
    default:
      await handleAnswer(ctx, text);
  }
}

function logRoute(
  ctx: HandlerContext,
  intent: Intent | "LEARN" | "FORGET",
  route: string,
): void {
  logger.info({ workspaceId: ctx.workspaceId, intent, route }, "routing mention");
}
