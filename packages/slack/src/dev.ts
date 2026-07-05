import { App } from "@slack/bolt";
import { requireEnv } from "./env.js";
import { createBoltLogger, logger } from "./logger.js";
import { registerListeners } from "./listeners.js";

const app = new App({
  token: requireEnv("SLACK_BOT_TOKEN"),
  appToken: requireEnv("SLACK_APP_TOKEN"),
  socketMode: true,
  logger: createBoltLogger(),
});

registerListeners(app);

await app.start();
logger.info("⚡ Griot is running in Socket Mode");
