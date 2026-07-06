<template>
  <div class="error-page">
    <div class="error-page__card">
      <p class="error-page__code">{{ error?.statusCode ?? 500 }}</p>

      <h1 class="error-page__title">
        {{ title }}
      </h1>

      <p class="error-page__message">
        {{ message }}
      </p>

      <button class="btn btn--primary" @click="handleBack">Go Home</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const title = computed(() => {
  if (props.error?.statusCode === 404) return "Page not found";
  return "Something went wrong";
});

const message = computed(() => {
  if (props.error?.statusCode === 404)
    return "The page you're looking for doesn't exist or has been moved.";
  return "An unexpected error occurred. Please try again later.";
});

const handleBack = () => clearError({ redirect: "/" });
</script>

<style scoped>
.error-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  padding: 1.5rem;
  font-family: var(--font-family);
}

.error-page__card {
  text-align: center;
  max-width: 420px;
}

.error-page__code {
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.error-page__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.error-page__message {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.75rem;
}
</style>
