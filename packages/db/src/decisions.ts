import { getPool } from "./pool.js";
import { toVectorParam } from "./vector.js";

export interface DecisionRow {
  id: string;
  workspace_id: string;
  content: string;
  decided_by: string | null;
  conflicts_with_decision: string | null;
  conflicts_with_knowledge: string | null;
  superseded_by: string | null;
  superseded_at: Date | null;
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

/**
 * A decision the Conflict Guard flagged, whose conflicting older memory is
 * still live — the one "replace the old rule" resolves.
 */
export interface PendingConflict {
  /** The new decision that was flagged. */
  id: string;
  content: string;
  old_decision_id: string | null;
  old_decision_content: string | null;
  old_knowledge_id: string | null;
  old_knowledge_content: string | null;
}

/** Append-only — decisions are never updated, only soft-deleted by "forget". */
export async function insertDecision(decision: NewDecision): Promise<string> {
  const result = await getPool().query<{ id: string }>(
    `INSERT INTO decisions (workspace_id, content, decided_by, embedding)
     VALUES ($1, $2, $3, $4::VECTOR)
     RETURNING id`,
    [
      decision.workspaceId,
      decision.content,
      decision.decidedBy,
      toVectorParam(decision.embedding),
    ],
  );
  const id = result.rows[0]?.id;
  if (!id) {
    throw new Error("insertDecision returned no id");
  }
  return id;
}

/**
 * Records which memory the Conflict Guard said a new decision contradicts —
 * exactly one of the two references, set after the verdict comes back.
 */
export async function setDecisionConflict(
  id: string,
  workspaceId: string,
  conflict: { decisionId: string } | { knowledgeId: string },
): Promise<void> {
  await getPool().query(
    `UPDATE decisions
        SET conflicts_with_decision = $3, conflicts_with_knowledge = $4
      WHERE id = $1 AND workspace_id = $2`,
    [
      id,
      workspaceId,
      "decisionId" in conflict ? conflict.decisionId : null,
      "knowledgeId" in conflict ? conflict.knowledgeId : null,
    ],
  );
}

/** Top-k live decisions by cosine similarity (soft-deleted and superseded excluded). */
export async function matchDecisions(
  workspaceId: string,
  embedding: number[],
  k = 5,
): Promise<DecisionMatch[]> {
  const vector = toVectorParam(embedding);
  const result = await getPool().query<DecisionMatch>(
    `SELECT id, content, 1 - (embedding <=> $2::VECTOR) AS similarity
       FROM decisions
      WHERE workspace_id = $1 AND deleted_at IS NULL AND superseded_at IS NULL
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
    `SELECT id, workspace_id, content, decided_by, conflicts_with_decision,
            conflicts_with_knowledge, superseded_by, superseded_at, deleted_at,
            created_at
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

/**
 * Newest flagged decision whose conflicting older memory hasn't been retired
 * yet. The joins re-check superseded_at so an already-resolved conflict never
 * comes back.
 */
export async function latestPendingConflict(
  workspaceId: string,
): Promise<PendingConflict | null> {
  const result = await getPool().query<PendingConflict>(
    `SELECT d.id, d.content,
            od.id AS old_decision_id, od.content AS old_decision_content,
            k.id AS old_knowledge_id, k.content AS old_knowledge_content
       FROM decisions d
       LEFT JOIN decisions od
         ON od.id = d.conflicts_with_decision
        AND od.workspace_id = d.workspace_id
        AND od.deleted_at IS NULL AND od.superseded_at IS NULL
       LEFT JOIN knowledge k
         ON k.id = d.conflicts_with_knowledge
        AND k.workspace_id = d.workspace_id
        AND k.superseded_at IS NULL
      WHERE d.workspace_id = $1 AND d.deleted_at IS NULL
        AND (od.id IS NOT NULL OR k.id IS NOT NULL)
      ORDER BY d.created_at DESC
      LIMIT 1`,
    [workspaceId],
  );
  return result.rows[0] ?? null;
}

/** Retires an old decision in favor of a new one; returns its content, or null if already retired. */
export async function supersedeDecision(
  id: string,
  workspaceId: string,
  supersededBy: string,
): Promise<string | null> {
  const result = await getPool().query<{ content: string }>(
    `UPDATE decisions
        SET superseded_by = $3, superseded_at = now()
      WHERE id = $1 AND workspace_id = $2 AND superseded_at IS NULL
      RETURNING content`,
    [id, workspaceId, supersededBy],
  );
  return result.rows[0]?.content ?? null;
}
