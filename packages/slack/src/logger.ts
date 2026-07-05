import { pino } from "pino";
import type { Logger, LogLevel } from "@slack/bolt";

export const logger = pino({
  name: "griot-slack",
  level: process.env.LOG_LEVEL ?? "info",
});

function format(msgs: unknown[]): string {
  return msgs
    .map((m) => {
      if (typeof m === "string") return m;
      if (m instanceof Error) return m.stack ?? m.message;
      return JSON.stringify(m);
    })
    .join(" ");
}

/** Adapts our pino logger to Bolt's Logger interface so Bolt internals log structured JSON too. */
export function createBoltLogger(): Logger {
  return {
    debug: (...msgs) => logger.debug(format(msgs)),
    info: (...msgs) => logger.info(format(msgs)),
    warn: (...msgs) => logger.warn(format(msgs)),
    error: (...msgs) => logger.error(format(msgs)),
    setLevel: (level) => {
      logger.level = level;
    },
    getLevel: () => logger.level as LogLevel,
    setName: () => {},
  };
}
