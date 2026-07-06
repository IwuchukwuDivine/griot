import { getPool } from "./pool.js";

/**
 * Claims a Slack event id for processing. Returns false when another
 * delivery already claimed it — the caller should skip the event.
 */
export async function claimEvent(
  workspaceId: string,
  eventId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `INSERT INTO processed_events (workspace_id, event_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING event_id`,
    [workspaceId, eventId],
  );
  return result.rows.length > 0;
}

/** Claims only need to outlive Slack's retry window; called from the crons. */
export async function pruneProcessedEvents(): Promise<number> {
  const result = await getPool().query(
    `DELETE FROM processed_events WHERE created_at < now() - INTERVAL '24 hours'`,
  );
  return result.rowCount ?? 0;
}
