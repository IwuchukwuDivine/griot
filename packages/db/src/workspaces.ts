import { getPool } from "./pool.js";

export type WorkspaceStatus = "active" | "disabled";

export interface WorkspaceRow {
  workspace_id: string;
  team_name: string | null;
  bot_token: string | null;
  status: WorkspaceStatus;
  created_at: Date;
}

export interface UpsertWorkspace {
  workspaceId: string;
  teamName: string | null;
  botToken: string;
}

/** Install/re-install: refreshes the token and reactivates, never duplicates. */
export async function upsertWorkspace(input: UpsertWorkspace): Promise<void> {
  await getPool().query(
    `INSERT INTO workspaces (workspace_id, team_name, bot_token, status)
     VALUES ($1, $2, $3, 'active')
     ON CONFLICT (workspace_id) DO UPDATE
        SET team_name = excluded.team_name,
            bot_token = excluded.bot_token,
            status = 'active'`,
    [input.workspaceId, input.teamName, input.botToken],
  );
}

/** Every workspace the crons should serve. */
export async function listActiveWorkspaces(): Promise<WorkspaceRow[]> {
  const result = await getPool().query<WorkspaceRow>(
    `SELECT workspace_id, team_name, bot_token, status, created_at
       FROM workspaces
      WHERE status = 'active'`,
  );
  return result.rows;
}

export async function getWorkspace(
  workspaceId: string,
): Promise<WorkspaceRow | null> {
  const result = await getPool().query<WorkspaceRow>(
    `SELECT workspace_id, team_name, bot_token, status, created_at
       FROM workspaces
      WHERE workspace_id = $1`,
    [workspaceId],
  );
  return result.rows[0] ?? null;
}
