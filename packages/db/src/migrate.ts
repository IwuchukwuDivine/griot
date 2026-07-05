import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type pg from "pg";
import { getPool } from "./pool.js";
import { logger } from "./logger.js";

// Resolves to packages/db/migrations from both src/ (dev) and dist/ (built).
const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations/", import.meta.url));

const ENSURE_TABLE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  name STRING PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR);
  return entries.filter((f) => f.endsWith(".sql")).sort();
}

async function appliedMigrations(pool: pg.Pool): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>(
    "SELECT name FROM schema_migrations",
  );
  return new Set(result.rows.map((r) => r.name));
}

/**
 * Applies any pending .sql migrations in name order, each in its own
 * transaction. Safe to run repeatedly. Returns the names it applied.
 */
export async function runMigrations(): Promise<string[]> {
  const pool = getPool();
  await pool.query(ENSURE_TABLE);

  const applied = await appliedMigrations(pool);
  const pending = (await listMigrationFiles()).filter((f) => !applied.has(f));

  for (const name of pending) {
    const sql = await readFile(`${MIGRATIONS_DIR}${name}`, "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        name,
      ]);
      await client.query("COMMIT");
      logger.info({ migration: name }, "applied migration");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  return pending;
}

/** Latest applied migration name, or null if none (used by the health check). */
export async function getLatestAppliedMigration(): Promise<string | null> {
  const result = await getPool().query<{ name: string }>(
    "SELECT name FROM schema_migrations ORDER BY name DESC LIMIT 1",
  );
  return result.rows[0]?.name ?? null;
}
