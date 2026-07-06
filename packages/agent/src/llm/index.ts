import { BedrockProvider } from "./bedrock.js";
import { GeminiProvider } from "./gemini.js";
import type { LlmProvider } from "./provider.js";

let provider: LlmProvider | undefined;

/** Lazily created singleton, picked by LLM_PROVIDER (default "gemini"). */
export function getLlm(): LlmProvider {
  if (!provider) {
    const name = process.env.LLM_PROVIDER ?? "gemini";
    switch (name) {
      case "gemini":
        provider = new GeminiProvider();
        break;
      case "bedrock":
        provider = new BedrockProvider();
        break;
      default:
        throw new Error(`Unknown LLM_PROVIDER: ${name}`);
    }
  }
  return provider;
}
