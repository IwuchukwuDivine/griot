<template>
  <section id="self-host" class="section">
    <div class="container-site">
      <span class="section-kicker">Self-hosting</span>
      <h2 class="section-title">Run it yourself — it's MIT licensed</h2>
      <p class="section-lead">
        Everything deploys from one repo with SST: the event Lambda, the OAuth
        flow, and both crons. Here's the shape of it.
      </p>

      <div class="selfhost__grid">
        <div class="card">
          <h3 class="selfhost__subtitle">You'll need</h3>
          <ul class="selfhost__prereqs">
            <li v-for="prereq in SELF_HOST_PREREQS" :key="prereq">
              <Check :size="16" class="selfhost__check" />
              <span>{{ prereq }}</span>
            </li>
          </ul>
        </div>

        <div class="card">
          <h3 class="selfhost__subtitle">Five steps</h3>
          <ol class="selfhost__steps">
            <li v-for="(step, index) in SELF_HOST_STEPS" :key="step.title">
              <span class="selfhost__step-number">{{ index + 1 }}</span>
              <span>
                <strong>{{ step.title }}.</strong>
                {{ step.detail }}
              </span>
            </li>
          </ol>
        </div>
      </div>

      <a
        :href="README_SELF_HOST_URL"
        class="btn btn--outline selfhost__cta"
        target="_blank"
        rel="noopener"
      >
        Full guide in the README
        <ArrowRight :size="16" />
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, Check } from "lucide-vue-next";
import {
  README_SELF_HOST_URL,
  SELF_HOST_PREREQS,
  SELF_HOST_STEPS,
} from "~/utils/constants/siteData";
</script>

<style scoped>
.selfhost__grid {
  display: grid;
  gap: 1.25rem;
  margin-top: 2.5rem;
}

@media (min-width: 900px) {
  .selfhost__grid {
    grid-template-columns: 2fr 3fr;
  }
}

.selfhost__subtitle {
  font-weight: 700;
  margin-bottom: 1rem;
}

.selfhost__prereqs {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.selfhost__prereqs li {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.selfhost__check {
  color: var(--color-success);
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.selfhost__steps {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.selfhost__steps li {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.selfhost__steps strong {
  color: var(--text-primary);
}

.selfhost__step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--surface-subtle);
  border: 1px solid var(--border-default);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: 0.1rem;
}

.selfhost__cta {
  margin-top: 1.75rem;
}
</style>
