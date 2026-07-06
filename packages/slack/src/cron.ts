import { runDailySummary, runDeadlineCheck } from "@griot/agent";
import { logger } from "./logger.js";

interface CronEvent {
  job?: string;
}

/** EventBridge cron entrypoint — the event's `job` field picks the work. */
export async function handler(event: CronEvent): Promise<void> {
  const job = event?.job;
  logger.info({ job }, "cron invoked");
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
