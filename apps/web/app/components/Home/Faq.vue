<template>
  <section id="faq" class="section section--muted">
    <div class="container-site faq__container">
      <span class="section-kicker">FAQ</span>
      <h2 class="section-title">Common questions</h2>

      <div class="faq__list">
        <details
          v-for="entry in FAQ_ENTRIES"
          :key="entry.question"
          class="faq__item"
        >
          <summary class="faq__question">
            <span>{{ entry.question }}</span>
            <ChevronDown :size="18" class="faq__chevron" />
          </summary>
          <p class="faq__answer">{{ entry.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { FAQ_ENTRIES } from "~/utils/constants/siteData";
</script>

<style scoped>
.faq__container {
  max-width: 52rem;
}

.faq__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
}

.faq__item {
  background: var(--surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: 0.85rem;
  padding: 0 1.25rem;
}

.faq__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  list-style: none;
}

.faq__question::-webkit-details-marker {
  display: none;
}

.faq__chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.faq__item[open] .faq__chevron {
  transform: rotate(180deg);
}

.faq__answer {
  padding-bottom: 1.1rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--text-secondary);
}
</style>
