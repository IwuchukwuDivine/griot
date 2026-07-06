<template>
  <div v-if="enabled" class="chat-widget">
    <Transition name="chat-pop">
      <section
        v-show="open"
        class="chat-widget__panel"
        aria-label="Ask Griot about Griot"
      >
        <header class="chat-widget__header">
          <div class="chat-widget__avatar" aria-hidden="true">G</div>
          <div>
            <p class="chat-widget__title">Ask Griot about Griot</p>
            <p class="chat-widget__subtitle">
              Live answers from its own memory
            </p>
          </div>
          <button
            type="button"
            class="chat-widget__close"
            aria-label="Close chat"
            @click="open = false"
          >
            <X :size="18" />
          </button>
        </header>

        <div ref="scroller" class="chat-widget__body">
          <p class="chat-widget__greeting">
            Hi! I'm Griot — this demo answers from a real knowledge base
            seeded about me. Each answer shows the memory chips it was
            grounded in.
          </p>

          <div v-if="turns.length === 0" class="chat-widget__starters">
            <button
              v-for="question in CHAT_STARTER_QUESTIONS"
              :key="question"
              type="button"
              class="chat-widget__starter"
              @click="ask(question)"
            >
              {{ question }}
            </button>
          </div>

          <ChatBubble
            v-for="(turn, index) in turns"
            :key="index"
            :turn="turn"
          />

          <div
            v-if="pending"
            class="chat-widget__typing"
            role="status"
            aria-label="Griot is typing"
          >
            <span class="chat-widget__typing-dot" />
            <span class="chat-widget__typing-dot" />
            <span class="chat-widget__typing-dot" />
          </div>
        </div>

        <form class="chat-widget__form" @submit.prevent="submit">
          <input
            v-model="draft"
            class="chat-widget__input"
            type="text"
            :maxlength="500"
            placeholder="Ask about Griot…"
            aria-label="Your question"
          >
          <button
            type="submit"
            class="chat-widget__send"
            :disabled="pending || !draft.trim()"
            aria-label="Send"
          >
            <Send :size="16" />
          </button>
        </form>
      </section>
    </Transition>

    <button
      type="button"
      class="chat-widget__launcher"
      :aria-expanded="open"
      aria-label="Chat with Griot"
      @click="open = !open"
    >
      <X v-if="open" :size="24" />
      <MessageCircle v-else :size="24" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { MessageCircle, Send, X } from "lucide-vue-next";
import { CHAT_STARTER_QUESTIONS } from "~/utils/constants/siteData";

const { baseUrl } = useRuntimeConfig().public;
// No endpoint configured (e.g. local dev without the backend) → no widget.
const enabled = computed(() => Boolean(baseUrl));

const { turns, pending, send } = useGriotChat();
const open = ref(false);
const draft = ref("");
const scroller = ref<HTMLElement | null>(null);

function ask(question: string): void {
  void send(question);
}

function submit(): void {
  const text = draft.value;
  draft.value = "";
  void send(text);
}

// Keep the newest message in view as the conversation grows.
watch([() => turns.value.length, pending], async () => {
  await nextTick();
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight });
});
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: calc(1.25rem + var(--right));
  bottom: calc(1.25rem + var(--bottom));
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.chat-widget__launcher {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: var(--text-on-primary);
  box-shadow: 0 10px 25px -8px rgb(0 0 0 / 0.35);
  transition: transform 0.15s ease;
}

.chat-widget__launcher:hover {
  transform: scale(1.06);
}

.chat-widget__panel {
  display: flex;
  flex-direction: column;
  width: min(24rem, calc(100vw - 2.5rem));
  height: min(32rem, calc(100dvh - 8rem));
  border: 1px solid var(--border-default);
  border-radius: 1rem;
  background: var(--surface-elevated);
  box-shadow:
    0 20px 45px -18px rgb(0 0 0 / 0.3),
    0 6px 14px -8px rgb(0 0 0 / 0.15);
  overflow: hidden;
}

.chat-widget__header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-light);
  background: var(--surface-muted);
}

.chat-widget__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.6rem;
  background: var(--color-primary);
  color: var(--text-on-primary);
  font-weight: 700;
}

.chat-widget__title {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.chat-widget__subtitle {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.chat-widget__close {
  margin-left: auto;
  color: var(--text-muted);
  padding: 0.25rem;
  border-radius: 0.4rem;
}

.chat-widget__close:hover {
  color: var(--text-primary);
  background: var(--surface-subtle);
}

.chat-widget__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  overflow-y: auto;
}

.chat-widget__greeting {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-muted);
  padding: 0.6rem 0.8rem;
  border-radius: 0.85rem;
  background: var(--surface-muted);
}

.chat-widget__starters {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.chat-widget__starter {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  transition: background 0.15s ease, color 0.15s ease;
}

.chat-widget__starter:hover {
  background: var(--color-primary);
  color: var(--text-on-primary);
}

/* Typing indicator: a griot-side bubble with three bouncing dots. */
.chat-widget__typing {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  align-self: flex-start;
  padding: 0.7rem 0.8rem;
  border-radius: 0.85rem;
  border-top-left-radius: 0.25rem;
  background: var(--surface-muted);
}

.chat-widget__typing-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: var(--text-muted);
  animation: chat-typing 1s ease-in-out infinite;
}

.chat-widget__typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.chat-widget__typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes chat-typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }

  30% {
    transform: translateY(-0.2rem);
    opacity: 1;
  }
}

.chat-widget__form {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid var(--border-light);
  background: var(--surface-elevated);
}

.chat-widget__input {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.8rem;
  border-radius: 0.65rem;
  border: 1px solid var(--border-default);
  background: var(--surface);
  font-size: 16px;
  color: var(--text-primary);
}

.chat-widget__input:focus {
  outline: 2px solid var(--ring-default);
  outline-offset: 1px;
}

.chat-widget__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  border-radius: 0.65rem;
  background: var(--color-primary);
  color: var(--text-on-primary);
}

.chat-widget__send:disabled {
  opacity: 0.5;
}

.chat-pop-enter-active,
.chat-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.chat-pop-enter-from,
.chat-pop-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.98);
}
</style>
