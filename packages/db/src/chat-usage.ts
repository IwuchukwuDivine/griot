import { getPool } from "./pool.js";

/**
 * Claims one slot against the web demo's global daily cap and returns the
 * running total for today (UTC), this call included. The caller compares the
 * result to the cap — incrementing first makes the check race-free.
 */
export async function incrementDailyChatCount(): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    `INSERT INTO chat_usage (day, count)
     VALUES (current_date, 1)
     ON CONFLICT (day) DO UPDATE SET count = chat_usage.count + 1
     RETURNING count`,
  );
  return Number(result.rows[0]?.count ?? 0);
}
