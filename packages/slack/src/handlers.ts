import {
  ANSWER_SYSTEM_PROMPT,
  CONFLICT_SYSTEM_PROMPT,
  TODO_DONE_SYSTEM_PROMPT,
  buildAnswerPrompt,
  buildConflictPrompt,
  buildTodoAddSystemPrompt,
  buildTodoDonePrompt,
  buildTodoUpdatePrompt,
  buildTodoUpdateSystemPrompt,
  formatDateInTz,
  getLlm,
  midnightInTz,
  parseLlmJson,
  resolveTz,
  todayInTz,
} from "@griot/agent";
import type { KnowledgeEntry, OpenTodoEntry } from "@griot/agent";
import {
  completeTodo,
  insertDecision,
  insertKnowledge,
  insertTodo,
  latestDecision,
  matchDecisions,
  matchKnowledge,
  openTodos,
  recentMessages,
  softDeleteDecision,
  updateTodo,
} from "@griot/db";
import type { TodoRow } from "@griot/db";
import { chunkText } from "./chunk.js";
import { logger } from "./logger.js";

export interface HandlerContext {
  workspaceId: string;
  channelId: string;
  senderName: string;
  reply: (text: string) => Promise<void>;
}

const NO_OPEN_TASKS = "No open tasks 🎉";
const CANT_MATCH_TASK =
  "Couldn't match that to an open task — try `what's pending?`";
const REPHRASE_TASK =
  "I couldn't parse that task — mind rephrasing? e.g. `Ada to design the flyer by Friday`";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toTodoEntry(todo: TodoRow, tz: string): OpenTodoEntry {
  return {
    id: todo.id,
    task: todo.task,
    owner: todo.owner,
    deadline: todo.deadline ? formatDateInTz(todo.deadline, tz) : null,
  };
}

/** Semantic memory: chunk, embed, and store taught text. */
export async function handleLearn(
  ctx: HandlerContext,
  content: string,
): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) {
    await ctx.reply(
      "Tell me what to learn, e.g. `@Griot learn Standard rate is $50/hour.`",
    );
    return;
  }
  const llm = getLlm();
  const chunks = chunkText(trimmed);
  for (const chunk of chunks) {
    const embedding = await llm.embed(chunk);
    await insertKnowledge({
      workspaceId: ctx.workspaceId,
      content: chunk,
      source: "taught",
      embedding,
    });
  }
  logger.info(
    { workspaceId: ctx.workspaceId, chunks: chunks.length },
    "learned knowledge",
  );
  await ctx.reply(
    `Learned ✅ (${chunks.length} chunk${chunks.length === 1 ? "" : "s"})`,
  );
}

/** RAG: embed the question, retrieve knowledge + recent conversation, answer grounded. */
export async function handleAnswer(
  ctx: HandlerContext,
  question: string,
): Promise<void> {
  const llm = getLlm();
  const embedding = await llm.embed(question);
  const [matches, recent] = await Promise.all([
    matchKnowledge(ctx.workspaceId, embedding, 5),
    recentMessages(ctx.workspaceId, ctx.channelId, 15),
  ]);
  const answer = await llm.complete({
    system: ANSWER_SYSTEM_PROMPT,
    prompt: buildAnswerPrompt({
      recent: recent.map((m) => ({
        sender: m.sender_name ?? m.sender_id ?? "unknown",
        text: m.text ?? "",
      })),
      matches,
      senderName: ctx.senderName,
      question,
    }),
    model: "smart",
  });
  await ctx.reply(answer);
}

/**
 * Episodic memory + the Conflict Guard: the decision is always logged
 * (append-only), but if it contradicts existing knowledge or a past
 * decision, Griot pushes back quoting the earlier rule.
 */
export async function handleDecision(
  ctx: HandlerContext,
  content: string,
): Promise<void> {
  const llm = getLlm();
  const embedding = await llm.embed(content);
  // Match before inserting so the new decision can't "conflict" with itself.
  const [knowledgeMatches, decisionMatches] = await Promise.all([
    matchKnowledge(ctx.workspaceId, embedding, 5),
    matchDecisions(ctx.workspaceId, embedding, 5),
  ]);
  await insertDecision({
    workspaceId: ctx.workspaceId,
    content,
    decidedBy: ctx.senderName,
    embedding,
  });

  const existing: KnowledgeEntry[] = [
    ...knowledgeMatches.map((m) => ({ source: m.source, content: m.content })),
    ...decisionMatches.map((m) => ({ source: "decision", content: m.content })),
  ];
  if (existing.length === 0) {
    await ctx.reply("Logged ✅");
    return;
  }

  const verdict = (
    await llm.complete({
      system: CONFLICT_SYSTEM_PROMPT,
      prompt: buildConflictPrompt(existing, content),
      model: "fast",
    })
  ).trim();

  if (/^ok[.!]?$/i.test(verdict)) {
    await ctx.reply("Logged ✅");
  } else {
    logger.info(
      { workspaceId: ctx.workspaceId, intent: "DECISION" },
      "conflict guard flagged a contradiction",
    );
    await ctx.reply(`Logged ✅\n\n⚠️ Heads-up: ${verdict}`);
  }
}

/** Undo for episodic memory: soft-deletes the most recent decision. */
export async function handleForget(ctx: HandlerContext): Promise<void> {
  const latest = await latestDecision(ctx.workspaceId);
  if (!latest) {
    await ctx.reply("Nothing to forget — no decisions logged.");
    return;
  }
  await softDeleteDecision(latest.id, ctx.workspaceId);
  await ctx.reply(`Forgotten 🗑️ — removed: "${latest.content}"`);
}

export async function handleTodoAdd(
  ctx: HandlerContext,
  text: string,
): Promise<void> {
  const tz = resolveTz();
  const { date, weekday } = todayInTz(tz);
  const raw = await getLlm().complete({
    system: buildTodoAddSystemPrompt(date, weekday, tz),
    prompt: text,
    model: "fast",
  });
  const parsed = parseLlmJson<{
    task?: unknown;
    owner?: unknown;
    deadline?: unknown;
  }>(raw);
  if (!parsed) {
    await ctx.reply(REPHRASE_TASK);
    return;
  }
  const task = typeof parsed.task === "string" ? parsed.task.trim() : "";
  if (!task) {
    await ctx.reply(REPHRASE_TASK);
    return;
  }
  const owner =
    typeof parsed.owner === "string" && parsed.owner.trim()
      ? parsed.owner.trim()
      : ctx.senderName;

  let deadline: Date | null = null;
  let deadlineStr: string | null = null;
  if (typeof parsed.deadline === "string" && parsed.deadline) {
    deadline = midnightInTz(parsed.deadline, tz);
    if (!deadline) {
      await ctx.reply(REPHRASE_TASK);
      return;
    }
    deadlineStr = parsed.deadline;
  }

  await insertTodo({ workspaceId: ctx.workspaceId, task, owner, deadline });
  await ctx.reply(
    `Noted 📝 ${task} — ${owner}${deadlineStr ? `, due ${deadlineStr}` : ""}`,
  );
}

export async function handleTodoDone(
  ctx: HandlerContext,
  text: string,
): Promise<void> {
  const todos = await openTodos(ctx.workspaceId);
  if (todos.length === 0) {
    await ctx.reply(NO_OPEN_TASKS);
    return;
  }
  const tz = resolveTz();
  const raw = (
    await getLlm().complete({
      system: TODO_DONE_SYSTEM_PROMPT,
      prompt: buildTodoDonePrompt(
        todos.map((t) => toTodoEntry(t, tz)),
        text,
      ),
      model: "fast",
    })
  ).trim();
  if (raw.toUpperCase() === "NONE") {
    await ctx.reply(CANT_MATCH_TASK);
    return;
  }
  const parsed = parseLlmJson<{ id?: unknown }>(raw);
  const id = typeof parsed?.id === "string" ? parsed.id : "";
  if (!UUID_RE.test(id)) {
    await ctx.reply(CANT_MATCH_TASK);
    return;
  }
  const row = await completeTodo(id, ctx.workspaceId);
  if (!row) {
    await ctx.reply(CANT_MATCH_TASK);
    return;
  }
  await ctx.reply(`Done ✅ ${row.task}`);
}

export async function handleTodoUpdate(
  ctx: HandlerContext,
  text: string,
): Promise<void> {
  const todos = await openTodos(ctx.workspaceId);
  if (todos.length === 0) {
    await ctx.reply(NO_OPEN_TASKS);
    return;
  }
  const tz = resolveTz();
  const { date } = todayInTz(tz);
  const raw = (
    await getLlm().complete({
      system: buildTodoUpdateSystemPrompt(date, tz),
      prompt: buildTodoUpdatePrompt(
        todos.map((t) => toTodoEntry(t, tz)),
        text,
      ),
      model: "fast",
    })
  ).trim();
  if (raw.toUpperCase() === "NONE") {
    await ctx.reply(CANT_MATCH_TASK);
    return;
  }
  const parsed = parseLlmJson<{
    id?: unknown;
    deadline?: unknown;
    owner?: unknown;
  }>(raw);
  if (!parsed) {
    await ctx.reply(CANT_MATCH_TASK);
    return;
  }
  const id = typeof parsed.id === "string" ? parsed.id : "";
  if (!UUID_RE.test(id)) {
    await ctx.reply(CANT_MATCH_TASK);
    return;
  }

  let deadline: Date | null = null;
  if (typeof parsed.deadline === "string" && parsed.deadline) {
    deadline = midnightInTz(parsed.deadline, tz);
    if (!deadline) {
      await ctx.reply(
        "I couldn't make sense of that new deadline — try a concrete date.",
      );
      return;
    }
  }
  const owner =
    typeof parsed.owner === "string" && parsed.owner.trim()
      ? parsed.owner.trim()
      : null;

  const row = await updateTodo(id, ctx.workspaceId, { owner, deadline });
  if (!row) {
    await ctx.reply(CANT_MATCH_TASK);
    return;
  }
  await ctx.reply(
    `Updated ✏️ ${row.task} — ${row.owner ?? "unassigned"}, due ${
      row.deadline ? formatDateInTz(row.deadline, tz) : "no deadline"
    }`,
  );
}

export async function handleTodoList(ctx: HandlerContext): Promise<void> {
  const todos = await openTodos(ctx.workspaceId);
  if (todos.length === 0) {
    await ctx.reply(NO_OPEN_TASKS);
    return;
  }
  const tz = resolveTz();
  const lines = todos.map(
    (t) =>
      `- ${t.task} — ${t.owner ?? "unassigned"}${
        t.deadline ? ` (due ${formatDateInTz(t.deadline, tz)})` : ""
      }`,
  );
  await ctx.reply(`📋 Open tasks:\n${lines.join("\n")}`);
}
