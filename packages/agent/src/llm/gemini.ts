import { EMBEDDING_DIM } from "@griot/db";
import { logger } from "../logger.js";
import { postJsonWithRetry } from "./http.js";
import type { CompleteOptions, LlmProvider, ModelTier } from "./provider.js";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";

const DEFAULT_MODELS: Record<ModelTier, string> = {
  smart: "gemini-2.5-flash",
  fast: "gemini-2.5-flash-lite",
};

interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

interface EmbedContentResponse {
  embedding?: { values?: number[] };
}

export class GeminiProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly models: Record<ModelTier, string>;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.apiKey = apiKey;
    this.models = {
      smart: process.env.GEMINI_SMART_MODEL ?? DEFAULT_MODELS.smart,
      fast: process.env.GEMINI_FAST_MODEL ?? DEFAULT_MODELS.fast,
    };
  }

  private post(path: string, body: unknown): Promise<unknown> {
    return postJsonWithRetry(
      `${BASE_URL}/${path}`,
      { "x-goog-api-key": this.apiKey },
      body,
    );
  }

  async complete(opts: CompleteOptions): Promise<string> {
    const model = this.models[opts.model ?? "smart"];
    const body = {
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    };

    // Gemini occasionally answers finishReason STOP with an empty candidate;
    // that slips past the HTTP retry loop, so retry the call once here.
    for (let attempt = 1; ; attempt++) {
      const data = (await this.post(
        `models/${model}:generateContent`,
        body,
      )) as GenerateContentResponse;

      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();
      if (text) {
        logger.debug({ model, chars: text.length }, "gemini completion");
        return text;
      }
      const finishReason = candidate?.finishReason ?? "unknown";
      if (attempt >= 2) {
        throw new Error(
          `Gemini returned no completion text (finishReason: ${finishReason})`,
        );
      }
      logger.warn({ model, finishReason }, "empty gemini completion — retrying");
    }
  }

  async embed(text: string): Promise<number[]> {
    const data = (await this.post(`models/${EMBEDDING_MODEL}:embedContent`, {
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIM,
    })) as EmbedContentResponse;

    const values = data.embedding?.values;
    if (!values || values.length !== EMBEDDING_DIM) {
      throw new Error(
        `Gemini returned a ${values?.length ?? 0}-dim embedding, expected ${EMBEDDING_DIM}`,
      );
    }
    // At dimensions below 3072 gemini-embedding-001 vectors are not unit-length;
    // normalize so stored and query vectors are always comparable.
    return normalize(values);
  }
}

function normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) {
    return values;
  }
  return values.map((v) => v / magnitude);
}
