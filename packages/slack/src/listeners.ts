import type { App } from "@slack/bolt";
import { getLlm } from "@griot/agent";
import {
  getWorkspace,
  insertKnowledge,
  insertMessage,
  matchKnowledge,
  recentMessages,
} from "@griot/db";
import { chunkText } from "./chunk.js";
import { logger } from "./logger.js";
import { ANSWER_SYSTEM_PROMPT, buildAnswerPrompt } from "./prompts.js";
import { resolveUserName } from "./users.js";

const NOT_SET_UP = "👋 I'm Griot, but this workspace isn't set up yet.";
const SOMETHING_WRONG =
  "Something went wrong on my side — try again in a moment.";

function stripMentions(text: string): string {
  return text.replace(/<@[^>]+>/g, "").trim();
}

type Reply = (text: string) => Promise<void>;

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
        text: event.text ?? "",
      });
    } catch (err) {
      logger.error({ err, eventTs: event.ts }, "failed to log channel message");
    }
  });

  app.event("app_mention", async ({ event, context, say, client }) => {
    // Slack retries delivery if we were slow to ack; don't reprocess.
    // First deliveries carry retryNum 0 (Socket Mode) or undefined (HTTP) — only skip real retries.
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
    const reply: Reply = async (text) => {
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

    const text = stripMentions(event.text);
    const learn = /^learn\s+/i.exec(text);

    try {
      if (learn) {
        await handleLearn(workspaceId, text.slice(learn[0].length), reply);
      } else {
        const senderName = event.user
          ? await resolveUserName(client, event.user)
          : "teammate";
        await handleAnswer(workspaceId, channelId, text, senderName, reply);
      }
    } catch (err) {
      logger.error({ err, workspaceId, channelId }, "mention handling failed");
      await reply(SOMETHING_WRONG);
    }
  });

  app.error(async (error) => {
    logger.error({ err: error }, "unhandled bolt error");
  });
}

/** Semantic memory: chunk, embed, and store taught text. */
async function handleLearn(
  workspaceId: string,
  content: string,
  reply: Reply,
): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) {
    await reply(
      "Tell me what to learn, e.g. `@Griot learn Standard rate is $50/hour.`",
    );
    return;
  }
  const llm = getLlm();
  const chunks = chunkText(trimmed);
  for (const chunk of chunks) {
    const embedding = await llm.embed(chunk);
    await insertKnowledge({
      workspaceId,
      content: chunk,
      source: "taught",
      embedding,
    });
  }
  logger.info({ workspaceId, chunks: chunks.length }, "learned knowledge");
  await reply(`Learned ✅ (${chunks.length} chunk${chunks.length === 1 ? "" : "s"})`);
}

/** RAG: embed the question, retrieve knowledge + recent conversation, answer grounded. */
async function handleAnswer(
  workspaceId: string,
  channelId: string,
  question: string,
  senderName: string,
  reply: Reply,
): Promise<void> {
  const llm = getLlm();
  const embedding = await llm.embed(question);
  const [matches, recent] = await Promise.all([
    matchKnowledge(workspaceId, embedding, 5),
    recentMessages(workspaceId, channelId, 15),
  ]);
  const answer = await llm.complete({
    system: ANSWER_SYSTEM_PROMPT,
    prompt: buildAnswerPrompt({ recent, matches, senderName, question }),
    model: "smart",
  });
  await reply(answer);
}
