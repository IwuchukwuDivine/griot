CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id STRING PRIMARY KEY,         -- Slack team_id
  team_name STRING,
  bot_token STRING,                        -- per-workspace token (OAuth later; nullable now)
  status STRING NOT NULL DEFAULT 'active', -- active | disabled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
