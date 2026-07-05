import { App, AwsLambdaReceiver } from "@slack/bolt";
import { requireEnv } from "./env.js";
import { createBoltLogger } from "./logger.js";
import { registerListeners } from "./listeners.js";

const receiver = new AwsLambdaReceiver({
  signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
  logger: createBoltLogger(),
});

const app = new App({
  token: requireEnv("SLACK_BOT_TOKEN"),
  receiver,
  // Lambda freezes once the response is sent, so finish processing first.
  // Our handlers are fast (one query + one reply), well inside Slack's 3s ack window.
  processBeforeResponse: true,
  logger: createBoltLogger(),
});

registerListeners(app);

type AwsHandler = Awaited<ReturnType<AwsLambdaReceiver["start"]>>;

export const handler: AwsHandler = async (event, context, callback) => {
  const boltHandler = await receiver.start();
  return boltHandler(event, context, callback);
};
