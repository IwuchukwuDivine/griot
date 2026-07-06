<template>
  <!--
    Mock Slack conversation. To swap in a real screenshot later, replace this
    component's usage with an <img> of the capture, e.g.:
    <img src="/screenshots/conflict-guard.png" alt="Griot's Conflict Guard in Slack" class="w-full rounded-2xl" />
  -->
  <div class="slack-chat">
    <div class="slack-chat__bar">
      <span class="slack-chat__dot slack-chat__dot--red" />
      <span class="slack-chat__dot slack-chat__dot--yellow" />
      <span class="slack-chat__dot slack-chat__dot--green" />
      <span class="slack-chat__channel"># {{ channel }}</span>
    </div>
    <div class="slack-chat__body">
      <SlackMessage
        v-for="(message, index) in messages"
        :key="`${message.time}-${index}`"
        :message="message"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatLine } from "~/utils/types/site";

defineProps<{
  channel: string;
  messages: ChatLine[];
}>();
</script>

<style scoped>
.slack-chat {
  border: 1px solid var(--border-default);
  border-radius: 1rem;
  background: var(--surface-elevated);
  overflow: hidden;
  box-shadow:
    0 10px 25px -12px rgb(0 0 0 / 0.15),
    0 4px 10px -6px rgb(0 0 0 / 0.08);
}

.slack-chat__bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--border-light);
  background: var(--surface-muted);
}

.slack-chat__dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 9999px;
}

.slack-chat__dot--red {
  background: #f87171;
}

.slack-chat__dot--yellow {
  background: #fbbf24;
}

.slack-chat__dot--green {
  background: #34d399;
}

.slack-chat__channel {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.slack-chat__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1rem;
}
</style>
