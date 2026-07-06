export const INTENTS = [
  "QUESTION",
  "DECISION",
  "TODO_ADD",
  "TODO_UPDATE",
  "TODO_DONE",
  "TODO_LIST",
  "RESEARCH",
  "EXPLAIN",
  "SUPERSEDE",
] as const;

export type Intent = (typeof INTENTS)[number];

/**
 * Maps the classifier's one-word reply to an intent, tolerating whitespace,
 * case, and stray punctuation. Anything unrecognized falls back to QUESTION.
 */
export function parseIntent(raw: string): Intent {
  const word = raw.trim().split(/\s+/)[0]?.toUpperCase().replace(/[^A-Z_]/g, "");
  return INTENTS.find((intent) => intent === word) ?? "QUESTION";
}
