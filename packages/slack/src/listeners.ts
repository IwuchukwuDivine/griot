import type { App } from "@slack/bolt";
import { getWorkspace } from "@griot/db";
import { logger } from "./logger.js";

const NOT_SET_UP = "👋 I'm Griot, but this workspace isn't set up yet.";

function stripMentions(text: string): string {
  return text.replace(/<@[^>]+>/g, "").trim();
}

/** Shared by the Socket Mode (dev) and Lambda entrypoints so behavior is identical. */
export function registerListeners(app: App): void {
  app.event("app_mention", async ({ event, context, say }) => {
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

    await say(`You said: ${stripMentions(event.text)}`);
  });

  app.error(async (error) => {
    logger.error({ err: error }, "unhandled bolt error");
  });
}
