import { getPool } from "./pool.js";
import { toVectorParam } from "./vector.js";

export interface KnowledgeMatch {
  id: string;
  content: string;
  source: string;
  /** Cosine similarity in [-1, 1]; higher is closer. */
  similarity: number;
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
 * Top-k knowledge entries by cosine similarity. Pinning workspace_id is what
 * lets the vector index (prefixed on workspace_id) serve the query.
 */
export async function matchKnowledge(
  workspaceId: string,
  embedding: number[],
  k = 5,
): Promise<KnowledgeMatch[]> {
  const vector = toVectorParam(embedding);
  const result = await getPool().query<KnowledgeMatch>(
    `SELECT id, content, source, 1 - (embedding <=> $2::VECTOR) AS similarity
       FROM knowledge
      WHERE workspace_id = $1
      ORDER BY embedding <=> $2::VECTOR
      LIMIT $3`,
    [workspaceId, vector, k],
  );
  return result.rows;
}
