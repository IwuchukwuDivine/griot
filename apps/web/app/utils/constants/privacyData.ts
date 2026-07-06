import type { PolicySection } from "~/utils/types/site";

export const PRIVACY_EFFECTIVE_DATE = "July 6, 2026";

export const PRIVACY_CONTACT_EMAIL = "ekeneifunanya@gmail.com";

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    title: "What Griot stores",
    paragraphs: [
      "Everything Griot remembers lives in CockroachDB, in tables tied to your Slack workspace:",
    ],
    bullets: [
      "Messages — a rolling window of recent messages per channel (including Griot's own replies), kept as conversation context.",
      "Knowledge — facts your team explicitly teaches it with \"learn ...\", stored with vector embeddings so they can be found again.",
      "Decisions — decisions Griot detects in conversation or that you log with #decision, kept append-only.",
      "Todos — tasks with their owners, deadlines, and the channel they came from.",
      "Workspace and user IDs — Slack workspace, channel, and user identifiers, so each memory attaches to the right team and the right people.",
    ],
  },
  {
    title: "Why it stores this",
    paragraphs: [
      "The data exists for one reason: memory. Messages give Griot conversational context, knowledge powers grounded answers, decisions feed the Conflict Guard, and todos drive task tracking and the morning deadline check. Griot doesn't collect anything beyond what those features need.",
    ],
  },
  {
    title: "Workspace isolation",
    paragraphs: [
      "Every table and every vector index is keyed by workspace_id, so similarity search is tenant-isolated at the index level — no query path exists that crosses workspaces. Your team's memory is visible to your workspace and no one else's.",
    ],
  },
  {
    title: "No selling, no sharing",
    paragraphs: [
      "Your data is never sold and never shared with third parties. There is no advertising, no analytics built on your messages, and no use of your data beyond serving your own workspace.",
    ],
  },
  {
    title: "LLM processing",
    paragraphs: [
      "To generate replies and embeddings, Griot sends message content to the Google Gemini API, where it is processed under Google's API terms. Griot is built on a provider-agnostic wrapper, so a self-hosted instance can point at a different provider.",
    ],
  },
  {
    title: "Deletion and contact",
    paragraphs: [
      "Saying \"@Griot forget that\" soft-deletes the latest decision — it stops applying immediately. For full deletion of your workspace's data, or any question about this policy, email ekeneifunanya@gmail.com and it will be handled promptly.",
    ],
  },
  {
    title: "Open source",
    paragraphs: [
      "Griot is MIT-licensed and open source, so you don't have to take this page's word for anything — you can read exactly what the code does, or self-host it so your data never leaves infrastructure you control.",
    ],
  },
];
