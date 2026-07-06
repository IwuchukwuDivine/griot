import { pino } from "pino";

export const logger = pino({
  name: "griot-agent",
  level: process.env.LOG_LEVEL ?? "info",
});
