<template>
  <section class="section">
    <div class="container-site privacy">
      <span class="section-kicker">Privacy</span>
      <h1 class="section-title">Privacy policy</h1>
      <p class="section-lead">
        Effective {{ PRIVACY_EFFECTIVE_DATE }}. Plain language, no legal maze —
        this is everything Griot does with your data.
      </p>

      <div class="privacy__sections">
        <section v-for="entry in PRIVACY_SECTIONS" :key="entry.title">
          <h2 class="privacy__heading">{{ entry.title }}</h2>
          <p
            v-for="paragraph in entry.paragraphs"
            :key="paragraph"
            class="privacy__text"
          >
            {{ paragraph }}
          </p>
          <ul v-if="entry.bullets" class="privacy__list">
            <li v-for="bullet in entry.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>
      </div>

      <p class="privacy__contact">
        Questions or deletion requests:
        <a :href="`mailto:${PRIVACY_CONTACT_EMAIL}`" class="privacy__mail">
          {{ PRIVACY_CONTACT_EMAIL }}
        </a>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_SECTIONS,
} from "~/utils/constants/privacyData";

useSeoMeta({
  title: "Privacy — Griot",
  description:
    "What Griot stores, why it stores it, how workspaces stay isolated, and how to get your data deleted. Plain language, no legal maze.",
});
</script>

<style scoped>
.privacy {
  max-width: 46rem;
}

.privacy__sections {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
  margin-top: 2.5rem;
}

.privacy__heading {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
}

.privacy__text {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-secondary);
}

.privacy__text + .privacy__text {
  margin-top: 0.75rem;
}

.privacy__list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1.25rem;
  list-style: disc;
}

.privacy__list li {
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--text-secondary);
}

.privacy__contact {
  margin-top: 2.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-light);
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.privacy__mail {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

.privacy__mail:hover {
  text-decoration: underline;
}
</style>
