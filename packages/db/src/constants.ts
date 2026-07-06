/**
 * Dimension of every embedding Griot stores or queries. The VECTOR(768)
 * columns in the migrations must match this value exactly — a mismatch
 * doesn't error, it silently breaks retrieval.
 */
export const EMBEDDING_DIM = 768;
