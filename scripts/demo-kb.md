# Griot demo knowledge base

## What Griot is

Griot is an AI teammate with institutional memory. It lives in your Slack workspace, answers questions from what your team has taught it, remembers decisions, tracks tasks, and keeps the rhythm with daily summaries. The name comes from West African griots — storytellers who carry a community's memory across generations.

You use Griot by @mentioning it in Slack and talking normally — no slash commands and no syntax to learn. An intent classifier reads each message and routes it to the right skill: answering, logging a decision, adding a task, and so on.

This web chat is a read-only demo surface: it answers questions about Griot itself from a dedicated demo workspace's memory. Logging decisions, adding todos, and teaching new facts all happen in Slack, where teams install Griot.

## The four memory types

Griot has four memory types, all stored in CockroachDB and all keyed by workspace_id: semantic memory (facts), episodic memory (decisions), task memory (todos), and working memory (recent conversation).

Semantic memory holds facts the team teaches with "@Griot learn ...". Each fact is chunked, embedded as a 768-dimension vector, and stored in the knowledge table behind a cosine vector index. Questions are answered with retrieval-augmented generation (RAG): the top-matching facts ground every answer.

Episodic memory holds team decisions. Griot auto-detects decisions from normal conversation ("we're switching to monthly invoicing") and logs them append-only in the decisions table; tagging a message with "#decision" forces one explicitly.

Task memory holds todos with owners and deadlines, parsed from plain language — "Ada is to design the flyer by Friday" becomes a task owned by Ada, due Friday. Adding, updating, completing, and listing tasks all work by just saying so.

Working memory is a rolling window of the last 15 messages per channel — including Griot's own replies — fed into every answer, so Griot can resolve references like "that", "it", or "what you said earlier" and stay consistent with itself.

## The Conflict Guard

The Conflict Guard is Griot's flagship feature. Every new decision is vector-matched against past decisions and the knowledge base before it lands. If the new decision contradicts an earlier rule, Griot still logs it — but pushes back in the channel, quoting the earlier rule so the team decides with full memory.

After the Conflict Guard flags a contradiction, saying "replace the old rule" supersedes the older memory: it is marked superseded (never deleted) and excluded from all retrieval from then on. Only the new rule is used in answers and future conflict checks.

Saying "forget that" undoes the latest decision with a soft delete. Decisions are append-only and nothing is ever hard-deleted, so the full audit trail stays inspectable.

## Provenance and answers

Every RAG answer records exactly which knowledge chunks went into it — the snippet, how closely it matched, and when it was learned. Ask Griot "why did you say that?" in Slack and it cites its own memory instead of hand-waving.

If a factual question is not covered by the knowledge base, Griot says "Not sure — that's not in my knowledge base yet" rather than inventing an answer. Grounded beats confident.

The small memory chips under answers on this demo page are retrieval made visible: each chip is a knowledge chunk that grounded the answer, shown with its match strength.

## Rhythms

Every evening, Griot posts a daily summary in each channel that had real activity — key discussions, decisions made, and action items with owners. Quiet channels are skipped, not spammed.

Every morning, Griot posts due-today and overdue task reminders in the channel where each task was created.

In Slack, you can also ask Griot to research something on the live web — it replies with concise findings plus the sources it used.

## Tech stack and data isolation

Griot's stack: a TypeScript monorepo; CockroachDB Cloud holding all four memory types with vector indexes for similarity search; AWS Lambda, API Gateway, and EventBridge crons for the runtime; and Gemini behind a provider-agnostic LLM wrapper, so swapping providers (Bedrock is stubbed in) is a config change.

Data isolation: every table and every vector index is keyed by workspace_id, so similarity search is tenant-isolated at the index level — no query path exists that crosses workspaces. This demo runs in its own isolated workspace too.

## Open source and installing

Griot is open source under the MIT license, at github.com/IwuchukwuDivine/griot. You can self-host it with a CockroachDB Cloud cluster (the free tier works), a Gemini API key, an AWS account, and a Slack app — the README walks through the whole setup.

To install Griot, click "Add to Slack" on this site. The OAuth flow registers your workspace and Griot DMs the installer a quick-start note; re-installing simply refreshes tokens.

Griot was built by Deevyn Ifunanya for the CockroachDB × AWS "Build with Agentic Memory" hackathon — an open-source rebuild of a WhatsApp assistant that runs in production for a small business. Teams forget what they decided; Griot doesn't.

## Pricing

Griot is completely free. It is an open-source project under the MIT license — there are no paid plans, no trials, and no billing. Install it in Slack at no cost, or self-host it on your own infrastructure for the cost of your own cloud accounts (CockroachDB has a free tier; Gemini and AWS usage at Griot's scale costs a few dollars a month at most).

## Why not just search Slack?

Slack search finds messages; it does not know which message was a decision, whether that decision was later overturned, or that "the rate" in a message from March means the consulting rate. Griot stores meaning, not just text: decisions are first-class records with an audit trail, facts are semantically searchable (ask in your own words, not the original phrasing), contradictions are actively flagged, and tasks have owners and deadlines that Griot follows up on itself. Search is passive; institutional memory is active.

## Privacy and what Griot stores

Griot stores, in CockroachDB and keyed to your workspace only: channel messages (for the rolling conversation window), facts your team teaches it, decisions it detects or you tag, and todos. Message text is sent to the LLM provider (Google Gemini) only to generate answers — it is not used to train models and is not shared with anyone else. Nothing is sold. To have a workspace's data deleted, email ekeneifunanya@gmail.com or uninstall and request deletion; because decisions are append-only with soft deletes, a full wipe is an explicit operation done on request.

## Support and contact

Questions, bugs, or feature requests: open an issue at github.com/IwuchukwuDivine/griot/issues or email ekeneifunanya@gmail.com. The landing page you are on now is griot-web-phi.vercel.app.

## Limits of this demo chat

This web demo answers up to 15 messages per visitor session and only answers questions — it cannot learn new facts, log decisions, or manage todos from here. Those live in Slack. If the demo says it has hit its daily limit, come back tomorrow or install Griot in Slack for the full experience.

## What is coming next

Planned next for Griot: document uploads straight into the knowledge base, a per-workspace usage dashboard, nightly memory consolidation (merging duplicate facts and flagging stale ones), Amazon Bedrock as a switch-on LLM provider, and more surfaces on the same memory — a customer-facing website widget and a WhatsApp variant, both answering from the same institutional memory the team maintains just by talking in Slack.
