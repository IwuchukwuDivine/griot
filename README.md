# Griot — an AI teammate with institutional memory

Griot is an AI Slack teammate that remembers your team's decisions, context, and history — and answers with them.

## Architecture

npm-workspaces monorepo, TypeScript strict throughout:

- **`packages/db`** — CockroachDB serverless access layer: `pg` pool with TLS, plain-SQL migration runner (`packages/db/migrations/*.sql`, tracked in `schema_migrations`), typed queries. No ORM.
- **`packages/slack`** — `@slack/bolt` app with two entrypoints sharing the same listeners: `dev.ts` (Socket Mode, local) and `lambda.ts` (`AwsLambdaReceiver`, production). Plus a tiny `health.ts` Lambda.
- **`packages/agent`** — Griot's reasoning core (empty shell; arrives in Phase 2).
- **`sst.config.ts`** — SST v3: API Gateway HTTP API → Lambda (Node 20, ARM, `eu-west-2`), secrets for Slack credentials and the database URL.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Slack app credentials and CockroachDB `DATABASE_URL`.
3. `npm run db:migrate` — applies pending SQL migrations (idempotent).
4. `npm run dev` — runs Griot locally over Socket Mode; mention the bot in a channel it's in.

Deploy: `npm run build && npx sst deploy`, set the three secrets with `npx sst secret set`, then paste the printed `slackEventsUrl` into your Slack app's **Event Subscriptions → Request URL**.

## License

[MIT](LICENSE) © 2026 Deevyn Ifunanya
