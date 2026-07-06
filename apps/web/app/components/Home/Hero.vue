<template>
  <section id="top" class="hero">
    <div class="container-site hero__inner">
      <div class="hero__copy">
        <span class="section-kicker">Open source · MIT · Slack app</span>
        <h1 class="hero__title">
          An AI teammate with
          <span class="hero__accent">institutional memory</span>
        </h1>
        <p class="section-lead hero__lead">
          Griot lives in your Slack workspace. It answers from what your team
          has taught it, remembers every decision — and pushes back when a new
          one contradicts an old one — tracks tasks in plain language, and
          keeps the rhythm with daily summaries and morning deadline checks.
        </p>
        <div class="hero__ctas">
          <a
            :href="slackInstallUrl"
            class="btn btn--primary"
            target="_blank"
            rel="noopener"
          >
            Add to Slack
          </a>
          <a
            :href="GITHUB_URL"
            class="btn btn--outline"
            target="_blank"
            rel="noopener"
          >
            <Github :size="18" />
            View on GitHub
          </a>
        </div>
      </div>

      <div class="hero__demo">
        <SlackChat channel="general" :messages="HERO_CHAT" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Github } from "lucide-vue-next";
import { GITHUB_URL, HERO_CHAT } from "~/utils/constants/siteData";

const slackInstallUrl = useRuntimeConfig().public.slackInstallUrl;
</script>

<style scoped>
.hero {
  padding-block: 5rem 4.5rem;
}

.hero__inner {
  display: grid;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero__inner {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

.hero__title {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.hero__accent {
  color: var(--color-primary);
}

.hero__lead {
  margin-bottom: 2rem;
}

.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
