<template>
  <div class="chat-bubble" :class="`chat-bubble--${turn.role}`">
    <div
      v-if="turn.role === 'griot'"
      class="chat-bubble__avatar"
      aria-hidden="true"
    >
      G
    </div>
    <div class="chat-bubble__content">
      <p class="chat-bubble__text">{{ turn.text }}</p>
      <div v-if="turn.sources?.length" class="chat-bubble__chips">
        <span
          v-for="source in turn.sources"
          :key="`${source.source}-${source.snippet}`"
          class="chat-bubble__chip"
          :title="source.snippet"
        >
          🧠 {{ source.source }} · {{ Math.round(source.similarity * 100) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatTurn } from "~/utils/types/chat";

defineProps<{ turn: ChatTurn }>();
</script>

<style scoped>
.chat-bubble {
  display: flex;
  gap: 0.5rem;
  max-width: 90%;
}

.chat-bubble--visitor {
  align-self: flex-end;
}

.chat-bubble--griot {
  align-self: flex-start;
}

.chat-bubble__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: 0.5rem;
  background: var(--color-primary);
  color: var(--text-on-primary);
  font-weight: 700;
  font-size: 0.8rem;
}

.chat-bubble__content {
  min-width: 0;
}

.chat-bubble__text {
  padding: 0.55rem 0.8rem;
  border-radius: 0.85rem;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: break-word;
}

.chat-bubble--visitor .chat-bubble__text {
  background: var(--color-primary);
  color: var(--text-on-primary);
  border-bottom-right-radius: 0.25rem;
}

.chat-bubble--griot .chat-bubble__text {
  background: var(--surface-muted);
  color: var(--text-secondary);
  border-top-left-radius: 0.25rem;
}

/* Memory chips: which knowledge chunks grounded this answer. */
.chat-bubble__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}

.chat-bubble__chip {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  border: 1px solid var(--border-default);
  background: var(--surface-elevated);
  color: var(--text-muted);
  cursor: help;
}
</style>
