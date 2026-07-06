/** "fast" for cheap classification-style calls, "smart" for user-facing answers. */
export type ModelTier = "fast" | "smart";

export interface CompleteOptions {
  system: string;
  prompt: string;
  model?: ModelTier;
  /** Ground the completion in live web search (provider-specific mechanism). */
  research?: boolean;
}

export interface LlmProvider {
  complete(opts: CompleteOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
}
