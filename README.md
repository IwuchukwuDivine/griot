# Griot — an AI teammate with institutional memory

Griot is an AI Slack teammate that remembers your team's decisions, context, and history — and answers with them.

## Architecture

npm-workspaces monorepo, TypeScript strict throughout:

- **`packages/db`** — CockroachDB serverless access layer: `pg` pool with TLS, plain-SQL migration runner (`packages/db/migrations/*.sql`, tracked in `schema_migrations`), typed queries. No ORM.
- **`packages/slack`** — `@slack/bolt` app with two entrypoints sharing the same listeners: `dev.ts` (Socket Mode, local) and `lambda.ts` (`AwsLambdaReceiver`, production). Plus a tiny `health.ts` Lambda.
- **`packages/agent`** — Griot's reasoning core: a provider-agnostic LLM wrapper (completion + embeddings) with Gemini as the primary provider and Bedrock behind a flag, selected by `LLM_PROVIDER`.
- **`sst.config.ts`** — SST v3: API Gateway HTTP API → Lambda (Node 20, ARM, `eu-west-2`), secrets for Slack credentials, the database URL, and the LLM API key.

### Memory model

Griot keeps four kinds of memory, all in CockroachDB and all scoped to a Slack workspace:

| Memory type | Table | What it holds |
| ----------- | ----- | ------------- |
| Semantic | `knowledge` | Facts the team teaches it, embedded and retrieved by vector similarity (RAG) with a CockroachDB vector index |
| Episodic | `decisions` | Team decisions, append-only with soft-delete undo |
| Task | `todos` | Tasks with owners, deadlines, and status |
| Working | `messages` | A rolling window of recent channel conversation (the bot's own replies included), fed into every answer |

Teach it with `@Griot learn <fact>`; ask it anything with a plain `@Griot <question>` — answers are grounded in the knowledge base plus the recent conversation, and it says so when it doesn't know. Embeddings are 768-dimensional end to end (`EMBEDDING_DIM` in `packages/agent`); the dimension must match the `VECTOR(768)` schema exactly, so change it in one place only.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Slack app credentials and CockroachDB `DATABASE_URL`.
3. `npm run db:migrate` — applies pending SQL migrations (idempotent).
4. `npm run dev` — runs Griot locally over Socket Mode; mention the bot in a channel it's in.

Deploy: `npm run build && npx sst deploy`, set the three secrets with `npx sst secret set`, then paste the printed `slackEventsUrl` into your Slack app's **Event Subscriptions → Request URL**.

## License

[MIT](LICENSE) © 2026 Deevyn Ifunanya
