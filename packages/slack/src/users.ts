import type { WebClient } from "@slack/web-api";
import { logger } from "./logger.js";

// Per-process cache; Lambda cold starts reset it, which is fine.
const names = new Map<string, string>();

// <@U123ABC> or <@U123ABC|deprecated-username>; W-prefixed ids are enterprise users.
const MENTION_RE = /<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g;

/**
 * Rewrites Slack mention tokens as display names so LLM prompts and logged
 * messages read naturally ("@Griot Ada is to..." must keep "Ada" as the
 * owner). The bot's own mention is dropped entirely.
 */
export async function resolveMentions(
  client: WebClient,
  text: string,
  botUserId: string | undefined,
): Promise<string> {
  const ids = new Set<string>();
  for (const match of text.matchAll(MENTION_RE)) {
    const id = match[1];
    if (id && id !== botUserId) {
      ids.add(id);
    }
  }
  const names = new Map<string, string>();
  for (const id of ids) {
    names.set(id, await resolveUserName(client, id));
  }
  return text
    .replace(MENTION_RE, (token, id: string) =>
      id === botUserId ? "" : (names.get(id) ?? token),
    )
    .replace(/ {2,}/g, " ") // dropping the bot mention leaves double spaces; keep newlines intact
    .trim();
}

/** Display name for a Slack user id, falling back to the id itself. */
export async function resolveUserName(
  client: WebClient,
  userId: string,
): Promise<string> {
  const cached = names.get(userId);
  if (cached) {
    return cached;
  }
  try {
    const res = await client.users.info({ user: userId });
    const name =
      res.user?.profile?.display_name ||
      res.user?.real_name ||
      res.user?.name ||
      userId;
    names.set(userId, name);
    return name;
  } catch (err) {
    logger.warn({ err, userId }, "users.info failed — falling back to id");
    return userId;
  }
}
