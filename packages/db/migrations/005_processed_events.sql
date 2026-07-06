-- Belt-and-braces dedupe for mention handling: the first delivery of a
-- Slack event claims its id here; redeliveries hit the primary key and
-- skip. Rows only need to outlive Slack's retry window (minutes) — the
-- cron handler prunes anything older than 24h.
CREATE TABLE IF NOT EXISTS processed_events (
  workspace_id STRING NOT NULL,
  event_id STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, event_id)
);
