<template>
  <section class="section section--muted">
    <div class="container-site">
      <span class="section-kicker">The problem</span>
      <h2 class="section-title">Teams forget. Constantly.</h2>
      <p class="section-lead">
        The knowledge is all there — it's just buried in channels nobody
        scrolls back through.
      </p>

      <div class="problem__grid">
        <div v-for="item in problems" :key="item.title" class="card">
          <component :is="item.icon" :size="22" class="problem__icon" />
          <h3 class="problem__title">{{ item.title }}</h3>
          <p class="problem__text">{{ item.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MessageSquareX, RotateCcw, ListX } from "lucide-vue-next";

const problems = [
  {
    icon: MessageSquareX,
    title: "Decisions vanish in the scroll",
    text: "The team agreed on something three weeks ago. Nobody remembers where, or exactly what.",
  },
  {
    icon: RotateCcw,
    title: "New hires ask the same questions",
    text: "The answers exist — scattered across channels, DMs, and the heads of two busy people.",
  },
  {
    icon: ListX,
    title: "Todos die in threads",
    text: "\"Can someone handle this by Friday?\" gets a thumbs-up, then silently expires.",
  },
] as const;
</script>

<style scoped>
.problem__grid {
  display: grid;
  gap: 1.25rem;
  margin-top: 2.5rem;
}

@media (min-width: 768px) {
  .problem__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.problem__icon {
  color: var(--color-primary);
  margin-bottom: 0.75rem;
}

.problem__title {
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.problem__text {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--text-secondary);
}
</style>
