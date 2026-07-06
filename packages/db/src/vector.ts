import { EMBEDDING_DIM } from "./constants.js";

/**
 * Serializes an embedding for a $n::VECTOR parameter, enforcing the one shared
 * dimension so a seeding/querying mismatch fails loudly instead of silently
 * returning garbage matches.
 */
export function toVectorParam(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `Expected a ${EMBEDDING_DIM}-dim embedding, got ${embedding.length}`,
    );
  }
  return `[${embedding.join(",")}]`;
}
