import { runMigrations } from "./migrate.js";
import { closePool } from "./pool.js";
import { logger } from "./logger.js";

try {
  const applied = await runMigrations();
  logger.info(
    { applied },
    applied.length === 0
      ? "no pending migrations"
      : `applied ${applied.length} migration(s)`,
  );
} catch (err) {
  logger.error({ err }, "migration failed");
  process.exitCode = 1;
} finally {
  await closePool();
}
