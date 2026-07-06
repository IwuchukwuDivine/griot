-- Public web-chat demo surface: the landing-page widget answers (read-only)
-- from this dedicated workspace's memory. No bot token — it is not a Slack
-- workspace, just a tenant like any other.
INSERT INTO workspaces (workspace_id, team_name, status)
VALUES ('griot-web-demo', 'Griot web demo', 'active')
ON CONFLICT (workspace_id) DO NOTHING;

-- Global daily message counter for the widget (one row per day) — a hard
-- ceiling on public LLM spend, checked before every reply.
CREATE TABLE IF NOT EXISTS chat_usage (
  day DATE PRIMARY KEY,
  count INT8 NOT NULL DEFAULT 0
);
