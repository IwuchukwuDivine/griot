import { getPool } from "./pool.js";

export type WorkspaceStatus = "active" | "disabled";

export interface WorkspaceRow {
  workspace_id: string;
  team_name: string | null;
  bot_token: string | null;
  status: WorkspaceStatus;
  created_at: Date;
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
