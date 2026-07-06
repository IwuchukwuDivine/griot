import type {
  ChatLine,
  FaqEntry,
  MemoryCard,
  SelfHostStep,
  UsageExample,
} from "~/utils/types/site";

export const GITHUB_URL = "https://github.com/IwuchukwuDivine/griot";
export const README_SELF_HOST_URL = `${GITHUB_URL}#self-hosting`;
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;

export const NAV_LINKS = [
  { label: "Memory", href: "#memory" },
  { label: "Conflict Guard", href: "#conflict-guard" },
  { label: "Usage", href: "#usage" },
  { label: "Architecture", href: "#architecture" },
  { label: "Self-host", href: "#self-host" },
  { label: "FAQ", href: "#faq" },
] as const;

export const MEMORY_CARDS: MemoryCard[] = [
  {
    icon: "semantic",
    name: "Semantic memory",
    table: "knowledge",
    summary:
      "Facts your team teaches it — chunked, embedded as VECTOR(768), and retrieved top-k through a cosine vector index. Answers are grounded RAG: if the knowledge isn't there, Griot says \"Not sure\" instead of inventing it.",
    example: "@Griot learn Our standard rate is $50/hour",
  },
  {
    icon: "episodic",
    name: "Episodic memory",
    table: "decisions",
    summary:
      "Team decisions, auto-detected from normal conversation and logged append-only. Saying \"forget\" soft-deletes the latest one, so every undo still leaves an audit trail.",
    example: "@Griot we're switching to monthly invoicing",
  },
  {
    icon: "task",
    name: "Task memory",
    table: "todos",
    summary:
      "Todos with owners and deadlines, parsed from plain language. Add, update, complete, and list tasks by just saying so — no syntax to learn.",
    example: "@Griot Ada is to design the flyer by Friday",
  },
  {
    icon: "working",
    name: "Working memory",
    table: "messages",
    summary:
      "A rolling window of the last 15 messages per channel — including Griot's own replies — so multi-turn context and self-consistency survive across the conversation.",
    example: "Automatic — every channel message keeps the window fresh",
  },
];

export const HERO_CHAT: ChatLine[] = [
  {
    author: "Nia",
    time: "9:41 AM",
    text: "@Griot what's our refund policy?",
  },
  {
    author: "Griot",
    bot: true,
    time: "9:41 AM",
    text: "Refunds are honored within 14 days of purchase, no questions asked. After that, store credit only — per the policy the team taught me in March.",
  },
];

export const CONFLICT_CHAT: ChatLine[] = [
  {
    author: "Sam",
    time: "2:14 PM",
    text: "@Griot #decision we're shipping the v2 release this Friday",
  },
  {
    author: "Griot",
    bot: true,
    time: "2:14 PM",
    text: "Logged ✅\n⚠️ Heads-up: this may contradict an earlier decision —",
    quote: "“No production deploys on Fridays” — logged 12 Jun",
  },
  {
    author: "Griot",
    bot: true,
    time: "2:14 PM",
    text: "Both are on the record. If one should go, just tell me to forget it.",
  },
];

export const USAGE_EXAMPLES: UsageExample[] = [
  {
    label: "Ask a question",
    you: "@Griot what's our refund policy?",
    griot:
      "Answers from the team knowledge base (RAG) — and says \"Not sure\" rather than inventing facts.",
  },
  {
    label: "Teach a fact",
    you: "@Griot learn We invoice on the 1st of every month",
    griot: "Stores it in semantic memory: chunked, embedded, vector-indexed.",
  },
  {
    label: "Log a decision",
    you: "@Griot we're switching to monthly invoicing",
    griot:
      "Auto-detects the decision and logs it — #decision forces it explicitly. Contradictions trigger the Conflict Guard.",
  },
  {
    label: "Undo a decision",
    you: "@Griot forget that",
    griot: "Soft-deletes the latest decision. Nothing is ever truly lost.",
  },
  {
    label: "Add a task",
    you: "@Griot Ada is to design the flyer by Friday",
    griot: "Creates a todo with the owner and deadline parsed from plain language.",
  },
  {
    label: "Complete a task",
    you: "@Griot the flyer is ready",
    griot: "Matches the message against open todos and closes the right one.",
  },
  {
    label: "List tasks",
    you: "@Griot what's pending?",
    griot: "Lists open tasks, soonest deadline first.",
  },
  {
    label: "Ask for provenance",
    you: "@Griot why did you say that?",
    griot:
      "Explains its last answer's sources — which memories it quoted, match strength, and when they were learned.",
  },
  {
    label: "Replace a rule",
    you: "@Griot replace the old rule",
    griot:
      "Retires the old rule the Conflict Guard flagged — only the new decision is retrieved from then on.",
  },
];

export const AUTOMATIC_JOBS = [
  {
    title: "Daily summary — 8:00 pm",
    detail:
      "Posts a recap in every channel that had real activity. Quiet channels are skipped, not spammed.",
  },
  {
    title: "Deadline check — 8:30 am",
    detail:
      "Posts due-today and overdue task reminders in the channel where each task was created.",
  },
] as const;

export const SELF_HOST_PREREQS = [
  "Node.js ≥ 22 and npm",
  "A CockroachDB Cloud cluster on v25.2+ (the free tier works)",
  "A Gemini API key",
  "An AWS account with credentials configured locally",
  "A Slack workspace where you can create apps",
] as const;

export const SELF_HOST_STEPS: SelfHostStep[] = [
  {
    title: "Clone and install",
    detail:
      "git clone the repo, npm install, and copy .env.example to .env.",
  },
  {
    title: "Migrate the database",
    detail:
      "Point DATABASE_URL at your CockroachDB cluster and run npm run db:migrate — schema, vector indexes and all.",
  },
  {
    title: "Create the Slack app",
    detail:
      "Add the bot scopes and event subscriptions, then copy the tokens and signing secret into .env.",
  },
  {
    title: "Run locally",
    detail:
      "npm run dev starts Griot over Socket Mode — invite @Griot to a channel and say hi.",
  },
  {
    title: "Deploy to AWS",
    detail:
      "Set the SST secrets and npx sst deploy — Lambda, API Gateway, and the EventBridge crons ship together.",
  },
];

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "Is my data isolated from other workspaces?",
    answer:
      "Yes. Every table and every vector index is keyed by workspace_id, so similarity search is tenant-isolated at the index level — no query path exists that crosses workspaces. Unknown workspaces get a polite \"not set up\" reply.",
  },
  {
    question: "What LLM does it use?",
    answer:
      "Gemini today, behind a provider-agnostic wrapper (complete + embed with retries and timeouts). A Bedrock provider sits behind a flag, so swapping providers is a config change, not a rewrite.",
  },
  {
    question: "Can I self-host it?",
    answer:
      "Yes — Griot is MIT-licensed and open source. You need a CockroachDB Cloud cluster, a Gemini API key, an AWS account, and a Slack app; the README walks through the whole setup.",
  },
  {
    question: "What does it store?",
    answer:
      "Recent channel messages (a rolling window), the facts you teach it, decisions, and todos — all in CockroachDB, all keyed by your workspace. Decisions are append-only, so the history stays inspectable.",
  },
  {
    question: "How do I undo something?",
    answer:
      "Say \"@Griot forget that\". The latest decision is soft-deleted — it stops applying, but the audit trail survives.",
  },
  {
    question: "Does it work in threads?",
    answer:
      "Yes. Mention @Griot in a thread and it replies there, with the same memory behind it.",
  },
];
