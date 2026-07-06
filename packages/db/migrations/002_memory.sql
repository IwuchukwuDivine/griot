-- The four memory types, all keyed by workspace_id (multi-tenant from day one).
-- VECTOR(768) must match EMBEDDING_DIM in packages/agent/src/constants.ts —
-- a dimension mismatch doesn't error, it silently breaks retrieval.

-- Semantic memory: taught facts, retrieved by vector similarity (RAG).
CREATE TABLE IF NOT EXISTS knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id STRING NOT NULL REFERENCES workspaces (workspace_id),
  content STRING NOT NULL,
  source STRING NOT NULL,                  -- taught | imported | ...
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prefix column means the index only serves queries that pin workspace_id —
-- exactly how matchKnowledge filters, and it keeps tenants isolated.
CREATE VECTOR INDEX IF NOT EXISTS knowledge_workspace_embedding_idx
  ON knowledge (workspace_id, embedding vector_cosine_ops);

-- Working memory: rolling per-channel conversation window, bot replies included.
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id STRING NOT NULL REFERENCES workspaces (workspace_id),
  channel_id STRING NOT NULL,
  slack_event_id STRING,                   -- NULL for rows we write ourselves (bot replies)
  sender_id STRING,
  sender_name STRING,
  text STRING,
  is_bot BOOL NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slack retries deliveries; a unique event id makes message writes idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS messages_workspace_event_id_key
  ON messages (workspace_id, slack_event_id)
  WHERE slack_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS messages_workspace_channel_recency_idx
  ON messages (workspace_id, channel_id, created_at DESC);

-- Episodic memory: append-only; "forget" is a soft delete via deleted_at.
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id STRING NOT NULL REFERENCES workspaces (workspace_id),
  content STRING NOT NULL,
  decided_by STRING,
  embedding VECTOR(768) NOT NULL,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task memory: natural-language add/update/done/list arrives in a later phase.
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id STRING NOT NULL REFERENCES workspaces (workspace_id),
  task STRING NOT NULL,
  owner STRING,
  deadline TIMESTAMPTZ NULL,
  status STRING NOT NULL DEFAULT 'open',   -- open | done
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_at TIMESTAMPTZ NULL
);
