import { createHmac, timingSafeEqual } from "node:crypto";
import { WebClient } from "@slack/web-api";
import { upsertWorkspace } from "@griot/db";
import { requireEnv } from "./env.js";
import { logger } from "./logger.js";

// im:write is required to open the onboarding DM; the rest match what the
// listeners and crons actually use.
const SCOPES = [
  "app_mentions:read",
  "chat:write",
  "channels:history",
  "im:history",
  "im:write",
  "users:read",
  "commands",
].join(",");

const STATE_TTL_MS = 10 * 60_000;

const ONBOARDING_MESSAGE = [
  "👋 Thanks for adding Griot! Here's how to work with me:",
  "- @mention me in any channel and talk normally",
  "- Teach me facts: `@Griot learn Our standard rate is $50/hour`",
  "- State decisions — I remember them and flag conflicts with what you taught me earlier",
  "- Assign todos in plain language: `@Griot Ada is to design the flyer by Friday`",
  "- I post a daily summary each evening and a morning deadline check — automatically",
  "Invite me to a channel and say hi!",
].join("\n");

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
}

function htmlResponse(statusCode: number, title: string, detail: string): HttpResponse {
  return {
    statusCode,
    headers: { "content-type": "text/html; charset=utf-8" },
    body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Griot</title></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1d21; color: #f8f8f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;"><div style="text-align: center; padding: 2rem; max-width: 28rem;"><h1 style="font-size: 1.5rem; margin-bottom: 0.75rem;">${title}</h1><p style="color: #ababad; line-height: 1.5;">${detail}</p></div></body></html>`,
  };
}

// State is `<timestamp>.<hmac(timestamp)>` — self-contained CSRF token, no
// storage needed. Signed with the Slack signing secret we already hold.
function signTimestamp(timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(timestamp).digest("hex");
}

export function createState(secret: string): string {
  const timestamp = Date.now().toString();
  return `${timestamp}.${signTimestamp(timestamp, secret)}`;
}

export function verifyState(state: string, secret: string): boolean {
  const [timestamp, mac] = state.split(".");
  if (!timestamp || !mac) {
    return false;
  }
  const expected = Buffer.from(signTimestamp(timestamp, secret));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return false;
  }
  const age = Date.now() - Number(timestamp);
  return Number.isFinite(age) && age >= 0 && age <= STATE_TTL_MS;
}

/** GET /slack/install → 302 to Slack's consent screen. */
export function buildInstallRedirect(redirectUri: string): HttpResponse {
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", requireEnv("SLACK_CLIENT_ID"));
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", createState(requireEnv("SLACK_SIGNING_SECRET")));
  url.searchParams.set("redirect_uri", redirectUri);
  return { statusCode: 302, headers: { location: url.toString() } };
}

/** GET /slack/oauth_redirect → verify state, exchange the code, store the workspace. */
export async function handleOauthCallback(
  query: Record<string, string | undefined>,
  redirectUri: string,
): Promise<HttpResponse> {
  if (query.error) {
    logger.info({ error: query.error, action: "install" }, "install declined");
    return htmlResponse(
      400,
      "Install cancelled",
      "No problem — you can add Griot any time from the install link.",
    );
  }
  if (!query.state || !verifyState(query.state, requireEnv("SLACK_SIGNING_SECRET"))) {
    logger.warn({ action: "install" }, "invalid or stale oauth state");
    return htmlResponse(
      400,
      "That link expired",
      "For safety, install links only last 10 minutes. Start again from the install page.",
    );
  }
  if (!query.code) {
    return htmlResponse(400, "Missing code", "Slack didn't send an authorization code. Try installing again.");
  }

  const access = await new WebClient().oauth.v2.access({
    client_id: requireEnv("SLACK_CLIENT_ID"),
    client_secret: requireEnv("SLACK_CLIENT_SECRET"),
    code: query.code,
    redirect_uri: redirectUri,
  });

  const teamId = access.team?.id;
  const botToken = access.access_token;
  if (!teamId || !botToken) {
    throw new Error("oauth.v2.access response is missing team id or bot token");
  }

  await upsertWorkspace({
    workspaceId: teamId,
    teamName: access.team?.name ?? null,
    botToken,
  });
  logger.info({ teamId, action: "install" }, "workspace installed");

  // Onboarding DM to the installer — never fail the install over it.
  const installerId = access.authed_user?.id;
  if (installerId) {
    try {
      const botClient = new WebClient(botToken, {
        rejectRateLimitedCalls: false,
      });
      const dm = await botClient.conversations.open({ users: installerId });
      if (dm.channel?.id) {
        await botClient.chat.postMessage({
          channel: dm.channel.id,
          text: ONBOARDING_MESSAGE,
        });
      }
    } catch (err) {
      logger.warn({ err, teamId, action: "install" }, "onboarding DM failed");
    }
  }

  return htmlResponse(
    200,
    "Griot is in ✅",
    "Invite @Griot to a channel and say hi.",
  );
}
