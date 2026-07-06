<template>
  <div class="slack-msg">
    <div
      class="slack-msg__avatar"
      :class="message.bot ? 'slack-msg__avatar--bot' : 'slack-msg__avatar--user'"
      aria-hidden="true"
    >
      {{ message.author.charAt(0) }}
    </div>

    <div class="slack-msg__content">
      <p class="slack-msg__meta">
        <span class="slack-msg__author">{{ message.author }}</span>
        <span v-if="message.bot" class="slack-msg__badge">APP</span>
        <span class="slack-msg__time">{{ message.time }}</span>
      </p>

      <p class="slack-msg__text">
        <span v-if="mention" class="slack-mention">{{ mention }}</span>{{ rest }}
      </p>

      <blockquote v-if="message.quote" class="slack-msg__quote">
        {{ message.quote }}
      </blockquote>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatLine } from "~/utils/types/site";

const props = defineProps<{ message: ChatLine }>();

const MENTION = "@Griot";

const mention = computed(() =>
  props.message.text.startsWith(MENTION) ? MENTION : "",
);

const rest = computed(() =>
  mention.value ? props.message.text.slice(MENTION.length) : props.message.text,
);
</script>

<style scoped>
.slack-msg {
  display: flex;
  gap: 0.75rem;
  text-align: left;
}

.slack-msg__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-on-primary);
}

.slack-msg__avatar--bot {
  background: var(--color-primary);
}

.slack-msg__avatar--user {
  background: var(--color-secondary);
}

.slack-msg__content {
  min-width: 0;
}

.slack-msg__meta {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
}

.slack-msg__author {
  font-weight: 700;
  font-size: 0.9rem;
}

.slack-msg__badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.slack-msg__time {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.slack-msg__text {
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--text-secondary);
  white-space: pre-line;
  overflow-wrap: break-word;
}

.slack-msg__quote {
  margin-top: 0.4rem;
  padding-left: 0.75rem;
  border-left: 3px solid var(--border-default);
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
