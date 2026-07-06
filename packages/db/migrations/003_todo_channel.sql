-- Deadline reminders post in the channel where the todo was created.
-- Pre-existing rows stay NULL and fall back to the workspace's most
-- recently active channel.
ALTER TABLE todos ADD COLUMN IF NOT EXISTS channel_id STRING NULL;
