/** "fast" for cheap classification-style calls, "smart" for user-facing answers. */
export type ModelTier = "fast" | "smart";

export interface CompleteOptions {
  system: string;
  prompt: string;
  model?: ModelTier;
}

export interface LlmProvider {
  complete(opts: CompleteOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
}
