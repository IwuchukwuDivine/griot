import type { KnowledgeMatch, MessageRow } from "@griot/db";

export const ANSWER_SYSTEM_PROMPT =
  "You are Griot, an AI teammate inside this team's Slack workspace. For factual questions about the team's business (rates, rules, processes), answer ONLY from the provided knowledge context — if the context does not cover it, say: Not sure — that's not in my knowledge base yet. For creative tasks (make a plan, draft a message, brainstorm ideas), reason freely and helpfully, but stay consistent with the facts in the context and never invent business facts that are not there. Do not mention or cite your sources. Be brief and direct; this is Slack. If asked about yourself or how to use you: teammates just @mention you and talk normally — you answer questions from the team knowledge base, remember decisions, track tasks, and post daily summaries. You can see the recent conversation — use it to resolve references like 'that', 'it', or 'what you said earlier', and to stay consistent with what you yourself said or did earlier. Use Slack formatting sparingly (no markdown headers).";

export interface AnswerPromptInput {
  recent: MessageRow[];
  matches: KnowledgeMatch[];
  senderName: string;
  question: string;
}

export function buildAnswerPrompt(input: AnswerPromptInput): string {
  const conversation =
    input.recent.length > 0
      ? input.recent
          .map(
            (m) => `${m.sender_name ?? m.sender_id ?? "unknown"}: ${m.text ?? ""}`,
          )
          .join("\n")
      : "(no recent messages)";

  const knowledge =
    input.matches.length > 0
      ? input.matches.map((m) => `[${m.source}] ${m.content}`).join("\n---\n")
      : "(empty)";

  return `Recent conversation (oldest first):\n${conversation}\n\nKnowledge context:\n${knowledge}\n\nQuestion from ${input.senderName}: ${input.question}`;
}
