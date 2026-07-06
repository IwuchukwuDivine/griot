import { runDailySummary, runDeadlineCheck } from "@griot/agent";
import { pruneProcessedEvents } from "@griot/db";
import { logger } from "./logger.js";

interface CronEvent {
  job?: string;
}

/** EventBridge cron entrypoint — the event's `job` field picks the work. */
export async function handler(event: CronEvent): Promise<void> {
  const job = event?.job;
  logger.info({ job }, "cron invoked");

  // Piggyback dedupe-ledger cleanup on the scheduled invocations.
  try {
    const pruned = await pruneProcessedEvents();
    if (pruned > 0) {
      logger.info({ pruned, job }, "pruned processed events");
    }
  } catch (err) {
    logger.warn({ err, job }, "processed-events prune failed");
  }

  switch (job) {
    case "daily_summary":
      await runDailySummary();
      break;
    case "deadline_check":
      await runDeadlineCheck();
      break;
    default:
      throw new Error(`Unknown cron job: ${String(job)}`);
  }
}
