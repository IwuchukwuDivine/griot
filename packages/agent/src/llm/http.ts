import { setTimeout as sleep } from "node:timers/promises";
import { logger } from "../logger.js";

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 30_000;

export class LlmHttpError extends Error {
  constructor(
    readonly status: number,
    body: string,
  ) {
    super(`LLM request failed (${status}): ${body.slice(0, 500)}`);
    this.name = "LlmHttpError";
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof LlmHttpError) {
    return err.status === 429 || err.status >= 500;
  }
  // Network failure or 30s timeout (TimeoutError) — worth another try.
  return true;
}

/** POSTs JSON and parses the JSON response, retrying 429/5xx/timeouts with backoff. */
export async function postJsonWithRetry(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new LlmHttpError(res.status, await res.text());
      }
      return await res.json();
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS || !isRetryable(err)) {
        throw err;
      }
      const delayMs = BASE_DELAY_MS * 2 ** (attempt - 1);
      logger.warn({ err, attempt, delayMs }, "llm request failed — retrying");
      await sleep(delayMs);
    }
  }
}
