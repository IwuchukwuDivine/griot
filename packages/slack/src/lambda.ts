import { App, AwsLambdaReceiver } from "@slack/bolt";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
} from "aws-lambda";
import { requireEnv } from "./env.js";
import { createBoltLogger, logger } from "./logger.js";
import { registerListeners } from "./listeners.js";
import { authorize } from "./authorize.js";
import { buildInstallRedirect, handleOauthCallback } from "./oauth.js";

const receiver = new AwsLambdaReceiver({
  signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
  logger: createBoltLogger(),
});

const app = new App({
  // Multi-workspace: tokens come from the workspaces table per team.
  authorize,
  receiver,
  // Lambda freezes once the response is sent, so finish processing first.
  // Slack's 3s ack window will lapse on slow LLM calls; the retry guard and
  // idempotent writes absorb the redeliveries.
  processBeforeResponse: true,
  // Wait out Slack 429s (retry-after) instead of surfacing them as errors.
  clientOptions: { rejectRateLimitedCalls: false },
  logger: createBoltLogger(),
});

registerListeners(app);

type BoltHandler = Awaited<ReturnType<AwsLambdaReceiver["start"]>>;

/**
 * One Lambda serves the OAuth install pages and the Bolt event endpoint —
 * the two GET paths are handled before anything reaches Bolt.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback,
): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  // The API Gateway default domain routes at the root; derive our own
  // callback URL from the request so nothing needs configuring.
  const redirectUri = `https://${event.requestContext.domainName}/slack/oauth_redirect`;

  if (method === "GET" && path.endsWith("/slack/install")) {
    return buildInstallRedirect(redirectUri);
  }
  if (method === "GET" && path.endsWith("/slack/oauth_redirect")) {
    try {
      return await handleOauthCallback(event.queryStringParameters ?? {}, redirectUri);
    } catch (err) {
      logger.error({ err, action: "install" }, "oauth callback failed");
      return {
        statusCode: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
        body: "Something went wrong finishing the install — please try again.",
      };
    }
  }

  const boltHandler = await receiver.start();
  return boltHandler(
    event as unknown as Parameters<BoltHandler>[0],
    context,
    callback,
  ) as Promise<APIGatewayProxyResultV2>;
};
