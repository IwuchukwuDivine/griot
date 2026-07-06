/** One knowledge chunk that grounded a demo answer — rendered as a memory chip. */
export type ChatSource = {
  source: string;
  snippet: string;
  similarity: number;
};

export type ChatRole = "visitor" | "griot";

export type ChatTurn = {
  role: ChatRole;
  text: string;
  sources?: ChatSource[];
};
