import { getPool } from "./pool.js";
import { toVectorParam } from "./vector.js";

export interface KnowledgeMatch {
  id: string;
  content: string;
  source: string;
  /** Cosine similarity in [-1, 1]; higher is closer. */
  similarity: number;
  created_at: Date;
}

export interface NewKnowledge {
  workspaceId: string;
  content: string;
  source: string;
  embedding: number[];
}

export async function insertKnowledge(knowledge: NewKnowledge): Promise<void> {
  await getPool().query(
    `INSERT INTO knowledge (workspace_id, content, source, embedding)
     VALUES ($1, $2, $3, $4::VECTOR)`,
    [
      knowledge.workspaceId,
      knowledge.content,
      knowledge.source,
      toVectorParam(knowledge.embedding),
    ],
  );
}

/**
 * Top-k live knowledge entries by cosine similarity (superseded ones
 * excluded). Pinning workspace_id is what lets the vector index (prefixed on
 * workspace_id) serve the query.
 */
export async function matchKnowledge(
  workspaceId: string,
  embedding: number[],
  k = 5,
): Promise<KnowledgeMatch[]> {
  const vector = toVectorParam(embedding);
  const result = await getPool().query<KnowledgeMatch>(
    `SELECT id, content, source, 1 - (embedding <=> $2::VECTOR) AS similarity,
            created_at
       FROM knowledge
      WHERE workspace_id = $1 AND superseded_at IS NULL
      ORDER BY embedding <=> $2::VECTOR
      LIMIT $3`,
    [workspaceId, vector, k],
  );
  return result.rows;
}

/** Retires a knowledge entry; returns its content, or null if already retired. */
export async function supersedeKnowledge(
  id: string,
  workspaceId: string,
): Promise<string | null> {
  const result = await getPool().query<{ content: string }>(
    `UPDATE knowledge
        SET superseded_at = now()
      WHERE id = $1 AND workspace_id = $2 AND superseded_at IS NULL
      RETURNING content`,
    [id, workspaceId],
  );
  return result.rows[0]?.content ?? null;
}
