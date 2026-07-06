<template>
  <section id="memory" class="section">
    <div class="container-site">
      <span class="section-kicker">The memory model</span>
      <h2 class="section-title">Four kinds of memory, one database</h2>
      <p class="section-lead">
        Everything lives in CockroachDB, keyed by workspace from the first row
        — vector search and transactional tables side by side.
      </p>

      <div class="memory__grid">
        <div v-for="card in MEMORY_CARDS" :key="card.name" class="card">
          <div class="memory__head">
            <component
              :is="iconMap[card.icon]"
              :size="22"
              class="memory__icon"
            />
            <h3 class="memory__name">{{ card.name }}</h3>
            <span class="code-pill">{{ card.table }}</span>
          </div>
          <p class="memory__summary">{{ card.summary }}</p>
          <p class="memory__example">
            <span class="memory__example-label">Example</span>
            {{ card.example }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  BookOpen,
  History,
  ListChecks,
  MessagesSquare,
} from "lucide-vue-next";
import type { Component } from "vue";
import { MEMORY_CARDS } from "~/utils/constants/siteData";
import type { MemoryIcon } from "~/utils/types/site";

const iconMap: Record<MemoryIcon, Component> = {
  semantic: BookOpen,
  episodic: History,
  task: ListChecks,
  working: MessagesSquare,
};
</script>

<style scoped>
.memory__grid {
  display: grid;
  gap: 1.25rem;
  margin-top: 2.5rem;
}

@media (min-width: 768px) {
  .memory__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.memory__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.memory__icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.memory__name {
  font-weight: 700;
  font-size: 1.05rem;
}

.memory__summary {
  font-size: 0.925rem;
  line-height: 1.65;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.memory__example {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
  background: var(--surface-subtle);
  border: 1px solid var(--border-default);
  border-radius: 0.6rem;
  padding: 0.6rem 0.8rem;
}

.memory__example-label {
  display: block;
  font-family: var(--font-family);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.2rem;
}
</style>
