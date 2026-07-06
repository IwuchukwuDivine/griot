import { getPool } from "./pool.js";
import { toVectorParam } from "./vector.js";

export interface DecisionRow {
  id: string;
  workspace_id: string;
  content: string;
  decided_by: string | null;
  deleted_at: Date | null;
  created_at: Date;
}

export interface DecisionMatch {
  id: string;
  content: string;
  /** Cosine similarity in [-1, 1]; higher is closer. */
  similarity: number;
}

export interface NewDecision {
  workspaceId: string;
  content: string;
  decidedBy: string | null;
  embedding: number[];
}

/** Append-only — decisions are never updated, only soft-deleted by "forget". */
export async function insertDecision(decision: NewDecision): Promise<void> {
  await getPool().query(
    `INSERT INTO decisions (workspace_id, content, decided_by, embedding)
     VALUES ($1, $2, $3, $4::VECTOR)`,
    [
      decision.workspaceId,
      decision.content,
      decision.decidedBy,
      toVectorParam(decision.embedding),
    ],
  );
}

/** Top-k live decisions by cosine similarity (soft-deleted ones excluded). */
export async function matchDecisions(
  workspaceId: string,
  embedding: number[],
  k = 5,
): Promise<DecisionMatch[]> {
  const vector = toVectorParam(embedding);
  const result = await getPool().query<DecisionMatch>(
    `SELECT id, content, 1 - (embedding <=> $2::VECTOR) AS similarity
       FROM decisions
      WHERE workspace_id = $1 AND deleted_at IS NULL
      ORDER BY embedding <=> $2::VECTOR
      LIMIT $3`,
    [workspaceId, vector, k],
  );
  return result.rows;
}

/** Most recent live decision — the one "forget" removes. */
export async function latestDecision(
  workspaceId: string,
): Promise<DecisionRow | null> {
  const result = await getPool().query<DecisionRow>(
    `SELECT id, workspace_id, content, decided_by, deleted_at, created_at
       FROM decisions
      WHERE workspace_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [workspaceId],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteDecision(
  id: string,
  workspaceId: string,
): Promise<void> {
  await getPool().query(
    `UPDATE decisions
        SET deleted_at = now()
      WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
    [id, workspaceId],
  );
}
