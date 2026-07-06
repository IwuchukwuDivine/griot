import { getPool } from "./pool.js";

/** One knowledge chunk that was actually fed into an answer's prompt. */
export interface KnowledgeSource {
  id: string;
  source: string;
  /** First 120 chars of the chunk. */
  snippet: string;
  similarity: number;
  /** ISO timestamp of when the chunk was learned. */
  created_at: string;
}

/** Provenance of a bot answer — stored as JSONB on the reply's messages row. */
export interface MessageSources {
  knowledge: KnowledgeSource[];
  usedConversationWindow: boolean;
}

export interface MessageRow {
  id: string;
  workspace_id: string;
  channel_id: string;
  slack_event_id: string | null;
  sender_id: string | null;
  sender_name: string | null;
  text: string | null;
  is_bot: boolean;
  sources: MessageSources | null;
  created_at: Date;
}

export interface NewMessage {
  workspaceId: string;
  channelId: string;
  /** Slack's event_id for deduping retried deliveries; null for our own replies. */
  slackEventId?: string | null;
  senderId?: string | null;
  senderName?: string | null;
  text: string;
  isBot?: boolean;
  sources?: MessageSources | null;
}

/** Idempotent: a retried Slack delivery hits the unique event-id index and is dropped. */
export async function insertMessage(message: NewMessage): Promise<void> {
  await getPool().query(
    `INSERT INTO messages
       (workspace_id, channel_id, slack_event_id, sender_id, sender_name, text, is_bot, sources)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT DO NOTHING`,
    [
      message.workspaceId,
      message.channelId,
      message.slackEventId ?? null,
      message.senderId ?? null,
      message.senderName ?? null,
      message.text,
      message.isBot ?? false,
      message.sources ? JSON.stringify(message.sources) : null,
    ],
  );
}

/** Most recent bot reply in a channel that recorded its provenance. */
export async function latestSourcedBotMessage(
  workspaceId: string,
  channelId: string,
): Promise<MessageRow | null> {
  const result = await getPool().query<MessageRow>(
    `SELECT id, workspace_id, channel_id, slack_event_id, sender_id,
            sender_name, text, is_bot, sources, created_at
       FROM messages
      WHERE workspace_id = $1 AND channel_id = $2
        AND is_bot = true AND sources IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [workspaceId, channelId],
  );
  return result.rows[0] ?? null;
}

/** Last n messages in a channel, oldest first — ready to feed into a prompt. */
export async function recentMessages(
  workspaceId: string,
  channelId: string,
  n = 15,
): Promise<MessageRow[]> {
  const result = await getPool().query<MessageRow>(
    `SELECT id, workspace_id, channel_id, slack_event_id, sender_id,
            sender_name, text, is_bot, sources, created_at
       FROM messages
      WHERE workspace_id = $1 AND channel_id = $2
      ORDER BY created_at DESC
      LIMIT $3`,
    [workspaceId, channelId, n],
  );
  return result.rows.reverse();
}

/** Human (non-bot) messages ever sent in a channel — the web demo's per-session cap. */
export async function countHumanMessages(
  workspaceId: string,
  channelId: string,
): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    `SELECT count(*) AS count
       FROM messages
      WHERE workspace_id = $1 AND channel_id = $2 AND is_bot = false`,
    [workspaceId, channelId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

/** Channels with at least `minHuman` human messages in the last `hours` hours. */
export async function activeChannels(
  workspaceId: string,
  minHuman = 5,
  hours = 24,
): Promise<string[]> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const result = await getPool().query<{ channel_id: string }>(
    `SELECT channel_id
       FROM messages
      WHERE workspace_id = $1 AND is_bot = false AND created_at >= $2
      GROUP BY channel_id
     HAVING count(*) >= $3`,
    [workspaceId, since, minHuman],
  );
  return result.rows.map((r) => r.channel_id);
}

/** Everything said in a channel in the last `hours` hours, oldest first. */
export async function channelMessagesSince(
  workspaceId: string,
  channelId: string,
  hours = 24,
): Promise<MessageRow[]> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const result = await getPool().query<MessageRow>(
    `SELECT id, workspace_id, channel_id, slack_event_id, sender_id,
            sender_name, text, is_bot, sources, created_at
       FROM messages
      WHERE workspace_id = $1 AND channel_id = $2 AND created_at >= $3
      ORDER BY created_at ASC`,
    [workspaceId, channelId, since],
  );
  return result.rows;
}

/** Channel of the workspace's most recent message — the reminder fallback. */
export async function mostRecentChannel(
  workspaceId: string,
): Promise<string | null> {
  const result = await getPool().query<{ channel_id: string }>(
    `SELECT channel_id
       FROM messages
      WHERE workspace_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [workspaceId],
  );
  return result.rows[0]?.channel_id ?? null;
}
