// Local runner for the cron jobs: node run-job.js <daily_summary|deadline_check>
import { closePool } from "@griot/db";
import { runDailySummary, runDeadlineCheck } from "./jobs.js";
import { logger } from "./logger.js";

const job = process.argv[2];

try {
  if (job === "daily_summary") {
    await runDailySummary();
  } else if (job === "deadline_check") {
    await runDeadlineCheck();
  } else {
    throw new Error(
      `Usage: run-job.js <daily_summary|deadline_check> (got: ${String(job)})`,
    );
  }
  logger.info({ job }, "job finished");
} catch (err) {
  logger.error({ err, job }, "job failed");
  process.exitCode = 1;
} finally {
  await closePool();
}
