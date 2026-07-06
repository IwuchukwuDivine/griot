import type { LlmProvider } from "./provider.js";

/**
 * Placeholder — this AWS account is capacity-throttled on Bedrock, so Gemini
 * is the primary provider. Wire the real implementation here and set
 * LLM_PROVIDER=bedrock if the throttle lifts.
 */
export class BedrockProvider implements LlmProvider {
  complete(): Promise<string> {
    return Promise.reject(new Error("Bedrock provider not enabled"));
  }

  embed(): Promise<number[]> {
    return Promise.reject(new Error("Bedrock provider not enabled"));
  }
}
