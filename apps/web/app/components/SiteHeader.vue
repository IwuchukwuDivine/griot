<template>
  <header class="site-header">
    <div class="container-site site-header__inner">
      <a href="/#top" class="site-header__brand">
        <img src="/favicon.svg" alt="" class="site-header__logo" />
        <span>Griot</span>
      </a>

      <nav class="site-header__nav" aria-label="Sections">
        <a
          v-for="link in NAV_LINKS"
          :key="link.href"
          :href="link.href"
          class="site-header__link"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="site-header__actions">
        <ThemeToggle />
        <a
          :href="GITHUB_URL"
          class="site-header__link site-header__github"
          target="_blank"
          rel="noopener"
          aria-label="Griot on GitHub"
        >
          <Github :size="18" />
        </a>
        <a
          :href="slackInstallUrl"
          class="btn btn--primary site-header__cta"
          target="_blank"
          rel="noopener"
        >
          Add to Slack
        </a>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Github } from "lucide-vue-next";
import { GITHUB_URL, NAV_LINKS } from "~/utils/constants/siteData";

const slackInstallUrl = useRuntimeConfig().public.slackInstallUrl;
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-light);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 4rem;
}

.site-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-primary);
  text-decoration: none;
}

.site-header__logo {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.4rem;
}

.site-header__nav {
  display: none;
  gap: 1.25rem;
}

@media (min-width: 1024px) {
  .site-header__nav {
    display: flex;
  }
}

.site-header__link {
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.site-header__link:hover {
  color: var(--text-primary);
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.site-header__cta {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .site-header__cta {
    display: none;
  }
}
</style>
