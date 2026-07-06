# Contributing to Griot

Thanks for your interest! Griot is a young project and contributions are welcome.

## Getting started

1. Fork and clone the repo
2. `npm install` (Node >= 22)
3. Copy `.env.example` to `.env` and fill in your own Slack app + CockroachDB + Gemini credentials (see README setup)
4. `npm run db:migrate` then `npm run dev` (Socket Mode)

## Making changes

- Open an issue first for anything non-trivial so we can discuss the approach
- Keep PRs focused — one change per PR
- `npm run build` and `npm run typecheck` must pass
- Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- No secrets in code or committed files, ever — new env vars go in `.env.example` with placeholder values

## Code style

- TypeScript strict mode, ESM only
- Structured logging via pino (no `console.log`)
- All data access is keyed by `workspace_id` — never write a query that crosses tenants
- Embedding dimensions are fixed in `packages/db/src/constants.ts` (`EMBEDDING_DIM`) — schema, seeding, and queries must all use it

## Reporting bugs

Open an issue with steps to reproduce, expected vs actual behavior, and relevant log output (redact tokens and connection strings).
