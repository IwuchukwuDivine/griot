import pg from "pg";
import { logger } from "./logger.js";

let pool: pg.Pool | undefined;

function sslConfig(databaseUrl: string): pg.PoolConfig["ssl"] {
  const { hostname, searchParams } = new URL(databaseUrl);
  const insecure =
    searchParams.get("sslmode") === "disable" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";
  return insecure ? undefined : { rejectUnauthorized: true };
}

/** Lazily created singleton Pool so Lambda cold starts don't pay for it at import time. */
export function getPool(): pg.Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: sslConfig(databaseUrl),
      // Lambda handles one event per instance — 2 covers a query racing a
      // Promise.all pair without hoarding CRDB connections across instances.
      max: 2,
    });
    // Idle connections get dropped (Lambda freeze, server-side timeout).
    // Without a listener the pool's 'error' event would crash the process;
    // pg discards the broken client and the next query gets a fresh one.
    pool.on("error", (err) => {
      logger.warn({ err }, "idle db connection dropped");
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
