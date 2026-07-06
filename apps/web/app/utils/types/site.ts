export type MemoryIcon = "semantic" | "episodic" | "task" | "working";

export type MemoryCard = {
  icon: MemoryIcon;
  name: string;
  table: string;
  summary: string;
  example: string;
};

export type ChatLine = {
  author: string;
  bot?: boolean;
  time: string;
  text: string;
  /** Optional Slack-style blockquote under the message (e.g. the earlier rule Griot quotes). */
  quote?: string;
};

export type UsageExample = {
  label: string;
  you: string;
  griot: string;
};

export type FaqEntry = {
  question: string;
  answer: string;
};

export type SelfHostStep = {
  title: string;
  detail: string;
};
