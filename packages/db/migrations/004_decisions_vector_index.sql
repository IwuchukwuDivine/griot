-- Decisions get the same cosine vector index as knowledge: the Conflict
-- Guard matches every new decision against past ones, and the prefix on
-- workspace_id keeps tenants isolated at the index level too.
CREATE VECTOR INDEX IF NOT EXISTS decisions_workspace_embedding_idx
  ON decisions (workspace_id, embedding vector_cosine_ops);
