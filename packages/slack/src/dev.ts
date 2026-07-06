import { App } from "@slack/bolt";
import { requireEnv } from "./env.js";
import { createBoltLogger, logger } from "./logger.js";
import { registerListeners } from "./listeners.js";
import { authorize } from "./authorize.js";

const app = new App({
  appToken: requireEnv("SLACK_APP_TOKEN"),
  socketMode: true,
  // Socket Mode is app-level: it delivers events from every workspace the
  // app is installed in, not just the dev one. Tokens must be resolved
  // per workspace here too (SLACK_BOT_TOKEN stays the dev fallback).
  authorize,
  logger: createBoltLogger(),
});

registerListeners(app);

await app.start();
logger.info("⚡ Griot is running in Socket Mode");
