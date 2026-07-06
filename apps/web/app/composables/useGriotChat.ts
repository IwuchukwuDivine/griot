import type { ChatSource, ChatTurn } from "~/utils/types/chat";

const SESSION_KEY = "griot-chat-session";
const MAX_MESSAGE_CHARS = 500;
const FAILURE_REPLY = "I'm napping — try again in a minute.";

/**
 * State and transport for the demo chat widget. The sessionId is a plain
 * uuid in sessionStorage — no personal data, it only groups one visit's
 * messages into a conversation the backend can rate-limit and recall.
 */
export function useGriotChat() {
  const { baseUrl } = useRuntimeConfig().public;
  const turns = ref<ChatTurn[]>([]);
  const pending = ref(false);

  function sessionId(): string {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateUuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  async function send(raw: string): Promise<void> {
    const message = raw.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!message || pending.value || !baseUrl) {
      return;
    }
    turns.value.push({ role: "visitor", text: message });
    pending.value = true;
    try {
      const response = await $fetch<{ reply: string; sources: ChatSource[] }>(
        `${baseUrl}/chat`,
        { method: "POST", body: { sessionId: sessionId(), message } },
      );
      turns.value.push({
        role: "griot",
        text: response.reply,
        sources: response.sources,
      });
    } catch (error) {
      // Rate-limit and validation replies arrive as { error } on a 4xx —
      // deliver them in Griot's voice; anything else gets the napping line.
      const data = (error as { data?: { error?: string } }).data;
      console.error(error);
      turns.value.push({ role: "griot", text: data?.error ?? FAILURE_REPLY });
    } finally {
      pending.value = false;
    }
  }

  return { turns, pending, send };
}
