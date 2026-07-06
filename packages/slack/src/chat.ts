import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  CLASSIFY_SYSTEM_PROMPT,
  WEB_DEMO_ANSWER_SYSTEM_PROMPT,
  buildAnswerPrompt,
  getLlm,
  parseIntent,
} from "@griot/agent";
import {
  countHumanMessages,
  getWorkspace,
  incrementDailyChatCount,
  insertMessage,
  latestSourcedBotMessage,
  matchKnowledge,
  recentMessages,
} from "@griot/db";
import type { MessageSources } from "@griot/db";
import { explainReply, knowledgeMinSimilarity } from "./handlers.js";
import { logger } from "./logger.js";

/**
 * Public web-chat demo: the landing-page widget POSTs here and gets a
 * read-only RAG answer from the demo workspace's memory. The workspace is
 * pinned server-side — nothing from the client can pick a tenant.
 */

const MAX_MESSAGE_CHARS = 500;
const SESSION_MESSAGE_CAP = 15;
const DEFAULT_DAILY_CAP = 500;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Explicit "explain your last answer" phrasings — see the note in answer().
const PROVENANCE_RE =
  /why did you (say|answer|reply)|where did (that|this|it) come from|what('s| is| was) (that|this) based on|how do you know (that|this)|(cite|show|what are) your sources?/i;

// Interrogative shape: starts with a question word or ends in "?". These go
// straight to the RAG path — no classifier call, no decline gate.
const QUESTION_SHAPE_RE =
  /^(what|who|why|how|when|where|which|is|are|am|was|were|do|does|did|can|could|will|would|should|tell me|explain)\b|\?\s*$/i;

const READ_ONLY_REPLY =
  "In this demo I only answer questions — install me in Slack to see decisions, todos, and the rest.";
const SESSION_CAP_REPLY =
  "This demo session has hit its message limit — add me to your Slack workspace to keep talking.";
const DAILY_CAP_REPLY =
  "The public demo has hit today's usage cap — come back tomorrow, or install me in Slack.";
const SOMETHING_WRONG = "Something went wrong on my side — try again in a moment.";

interface ChatSource {
  source: string;
  snippet: string;
  similarity: number;
}

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function dailyCap(): number {
  const raw = Number(process.env.CHAT_DAILY_CAP);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_CAP;
}

/** URLs are stripped, not answered — the demo is not a link-expansion service. */
function sanitizeMessage(raw: string): string {
  return raw.replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
}

interface ParsedRequest {
  sessionId: string;
  message: string;
}

function parseRequest(body: string | undefined): ParsedRequest | null {
  if (!body) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const { sessionId, message } = parsed as Record<string, unknown>;
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
    return null;
  }
  if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) {
    return null;
  }
  return { sessionId: sessionId.toLowerCase(), message };
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const request = parseRequest(event.body);
    if (!request) {
      return json(400, {
        error: `Send JSON with a uuid sessionId and a message under ${MAX_MESSAGE_CHARS} characters.`,
      });
    }
    const message = sanitizeMessage(request.message);
    if (!message) {
      return json(400, { error: "Say something — the message was empty." });
    }

    // The demo tenant comes from the environment, never from the client.
    const workspaceId = process.env.DEMO_WORKSPACE_ID ?? "griot-web-demo";
    const workspace = await getWorkspace(workspaceId);
    if (!workspace || workspace.status !== "active") {
      logger.error({ workspaceId }, "demo workspace missing or disabled");
      return json(503, { error: "The demo isn't set up right now." });
    }

    const channelId = `web:${request.sessionId}`;
    if ((await countHumanMessages(workspaceId, channelId)) >= SESSION_MESSAGE_CAP) {
      return json(429, { error: SESSION_CAP_REPLY });
    }
    // Increment-then-compare, so concurrent requests can't slip past the cap.
    if ((await incrementDailyChatCount()) > dailyCap()) {
      logger.warn({ workspaceId }, "web demo daily cap reached");
      return json(429, { error: DAILY_CAP_REPLY });
    }

    await insertMessage({
      workspaceId,
      channelId,
      senderName: "visitor",
      text: message,
    });

    const reply = await answer(workspaceId, channelId, message);

    await insertMessage({
      workspaceId,
      channelId,
      senderName: "Griot",
      text: reply.text,
      isBot: true,
      sources: reply.stored,
    });

    return json(200, { reply: reply.text, sources: reply.sources });
  } catch (err) {
    logger.error({ err, route: "chat" }, "web chat request failed");
    return json(500, { error: SOMETHING_WRONG });
  }
};

/**
 * The RAG answer path, and nothing else: any message the classifier would
 * route to a write intent (decision, todo, learn, ...) gets the read-only
 * reply instead. Prefix shortcuts are caught before spending a classify call.
 */
async function answer(
  workspaceId: string,
  channelId: string,
  message: string,
): Promise<{ text: string; sources: ChatSource[]; stored: MessageSources | null }> {
  const llm = getLlm();

  if (/^(learn|forget)\b/i.test(message) || /#decision/i.test(message)) {
    return { text: READ_ONLY_REPLY, sources: [], stored: null };
  }

  // Provenance is read-only too — "why did you say that?" cites the memories
  // behind the previous answer, like in Slack. Detected by phrasing, NOT by
  // the classifier: here nearly every message contains the word "Griot"
  // ("what is Griot?"), which the fast model over-reads as EXPLAIN ("asks
  // why Griot said something") — those must stay ordinary questions.
  if (
    PROVENANCE_RE.test(message) &&
    (await countHumanMessages(workspaceId, channelId)) > 1
  ) {
    const last = await latestSourcedBotMessage(workspaceId, channelId);
    if (last) {
      return { text: explainReply(last.sources), sources: [], stored: null };
    }
  }

  // The fast classifier is jumpy on this surface (visitors phrase everything
  // around the word "Griot"), so anything question-shaped skips it entirely.
  // Only statements get classified, and only write intents are declined —
  // EXPLAIN without provenance phrasing is the "Griot" misfire, so it falls
  // through to the answer path like a question.
  if (!QUESTION_SHAPE_RE.test(message)) {
    const intent = parseIntent(
      await llm.complete({
        system: CLASSIFY_SYSTEM_PROMPT,
        prompt: message,
        model: "fast",
      }),
    );
    if (intent !== "QUESTION" && intent !== "EXPLAIN") {
      logger.info(
        { workspaceId, intent, route: "chat" },
        "blocked non-question intent",
      );
      return { text: READ_ONLY_REPLY, sources: [], stored: null };
    }
  }

  const embedding = await llm.embed(message);
  const [rawMatches, recent] = await Promise.all([
    matchKnowledge(workspaceId, embedding, 5),
    recentMessages(workspaceId, channelId, 15),
  ]);
  const matches = rawMatches.filter(
    (m) => m.similarity >= knowledgeMinSimilarity(),
  );

  const text = await llm.complete({
    system: WEB_DEMO_ANSWER_SYSTEM_PROMPT,
    prompt: buildAnswerPrompt({
      recent: recent.map((m) => ({
        sender: m.sender_name ?? "visitor",
        text: m.text ?? "",
      })),
      matches,
      senderName: "visitor",
      question: message,
    }),
    model: "smart",
  });

  return {
    text,
    // The widget renders these as "memory chips" — retrieval made visible.
    sources: matches.map((m) => ({
      source: m.source,
      snippet: m.content.slice(0, 120),
      similarity: m.similarity,
    })),
    stored: {
      knowledge: matches.map((m) => ({
        id: m.id,
        source: m.source,
        snippet: m.content.slice(0, 120),
        similarity: m.similarity,
        created_at: m.created_at.toISOString(),
      })),
      usedConversationWindow: true,
    },
  };
}
