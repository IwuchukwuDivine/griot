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
      // Plain fetch, not $fetch: HTTP errors don't throw here, so the
      // backend's { error } bodies (rate limits, validation) always surface
      // in Griot's voice regardless of status code.
      const response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId(), message }),
      });
      const body = (await response.json().catch(() => null)) as {
        reply?: string;
        sources?: ChatSource[];
        error?: string;
      } | null;
      turns.value.push({
        role: "griot",
        text: (response.ok ? body?.reply : body?.error) ?? FAILURE_REPLY,
        sources: response.ok ? body?.sources : undefined,
      });
    } catch (error) {
      // Only network/CORS failures land here now.
      console.error(error);
      turns.value.push({ role: "griot", text: FAILURE_REPLY });
    } finally {
      pending.value = false;
    }
  }

  return { turns, pending, send };
}
