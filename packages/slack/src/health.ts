import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getLatestAppliedMigration } from "@griot/db";
import { logger } from "./logger.js";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const migrations = await getLatestAppliedMigration();
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, migrations }),
    };
  } catch (err) {
    logger.error({ err }, "health check failed");
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false }),
    };
  }
};
