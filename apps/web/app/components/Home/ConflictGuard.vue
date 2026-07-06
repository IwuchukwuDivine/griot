<template>
  <section id="conflict-guard" class="section section--muted">
    <div class="container-site conflict__inner">
      <div>
        <span class="section-kicker">Flagship feature</span>
        <h2 class="section-title">The Conflict Guard</h2>
        <p class="section-lead conflict__lead">
          Every new decision is vector-matched against past decisions and the
          knowledge base before it lands. On a contradiction, Griot still logs
          it — your team stays in charge — but it pushes back, quoting the
          earlier rule so nobody overwrites history by accident.
        </p>

        <ul class="conflict__points">
          <li v-for="point in points" :key="point">
            <ShieldAlert :size="18" class="conflict__point-icon" />
            <span>{{ point }}</span>
          </li>
        </ul>
      </div>

      <SlackChat channel="engineering" :messages="CONFLICT_CHAT" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ShieldAlert } from "lucide-vue-next";
import { CONFLICT_CHAT } from "~/utils/constants/siteData";

const points = [
  "Logs first, warns second — the decision is never blocked, only flagged.",
  "Matches against both past decisions and taught knowledge.",
  "Quotes the exact earlier rule, with the date it was logged.",
  "One \"forget\" resolves it — the soft delete keeps the audit trail.",
] as const;
</script>

<style scoped>
.conflict__inner {
  display: grid;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .conflict__inner {
    grid-template-columns: 1fr 1fr;
  }
}

.conflict__lead {
  margin-bottom: 1.5rem;
}

.conflict__points {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.conflict__points li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: 0.925rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.conflict__point-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 0.15rem;
}
</style>
