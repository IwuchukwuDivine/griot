import type { WebClient } from "@slack/web-api";
import { logger } from "./logger.js";

// Per-process cache; Lambda cold starts reset it, which is fine.
const names = new Map<string, string>();

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
