<template>
  <footer class="site-footer">
    <div class="container-site site-footer__inner">
      <div class="site-footer__brand">
        <p class="site-footer__name">Griot</p>
        <p class="site-footer__note">
          Built for the CockroachDB × AWS "Build with Agentic Memory"
          hackathon.
        </p>
      </div>

      <div class="site-footer__links">
        <NuxtLink to="/privacy">Privacy</NuxtLink>
        <a :href="GITHUB_URL" target="_blank" rel="noopener">GitHub</a>
        <a :href="LICENSE_URL" target="_blank" rel="noopener">MIT License</a>
        <a :href="README_SELF_HOST_URL" target="_blank" rel="noopener">
          Self-hosting guide
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import {
  GITHUB_URL,
  LICENSE_URL,
  README_SELF_HOST_URL,
} from "~/utils/constants/siteData";
</script>

<style scoped>
.site-footer {
  border-top: 1px solid var(--border-light);
  padding-block: 2.5rem;
  background: var(--surface-muted);
}

.site-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.site-footer__name {
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.site-footer__note {
  font-size: 0.85rem;
  color: var(--text-muted);
  max-width: 24rem;
}

.site-footer__links {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.site-footer__links a {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
}

.site-footer__links a:hover {
  color: var(--text-primary);
  text-decoration: underline;
}
</style>
