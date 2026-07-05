import { pino } from "pino";

export const logger = pino({
  name: "griot-db",
  level: process.env.LOG_LEVEL ?? "info",
});
