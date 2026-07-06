/**
 * Parses JSON out of an LLM reply, tolerating code fences and surrounding
 * whitespace. Returns null instead of throwing — the caller decides how to
 * ask the user to rephrase.
 */
export function parseLlmJson<T>(raw: string): T | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
