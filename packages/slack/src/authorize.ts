import type { AuthorizeResult } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { getWorkspace } from "@griot/db";

// auth.test results per token; per-process, reset on Lambda cold start.
const cache = new Map<string, AuthorizeResult>();

/**
 * Per-workspace token lookup for Bolt: installed workspaces use their stored
 * bot token; the dev workspace (row without a token, or no row) falls back to
 * SLACK_BOT_TOKEN. Inactive workspaces still resolve — listeners keep the
 * polite "not set up" reply instead of dropping the event.
 */
export async function authorize({
  teamId,
}: {
  teamId?: string;
}): Promise<AuthorizeResult> {
  const workspace = teamId ? await getWorkspace(teamId) : null;
  const botToken = workspace?.bot_token ?? process.env.SLACK_BOT_TOKEN;
  if (!botToken) {
    throw new Error(
      `No bot token for team ${teamId ?? "unknown"} and SLACK_BOT_TOKEN is unset`,
    );
  }
  const cached = cache.get(botToken);
  if (cached) {
    return cached;
  }
  // Bolt needs botUserId so listeners can tell Griot's own mention apart.
  const auth = await new WebClient(botToken, {
    rejectRateLimitedCalls: false,
  }).auth.test();
  const result: AuthorizeResult = {
    botToken,
    botId: auth.bot_id,
    botUserId: auth.user_id,
    teamId,
  };
  cache.set(botToken, result);
  return result;
}
