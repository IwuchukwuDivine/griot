<template>
  <ClientOnly>
    <button
      class="theme-toggle"
      type="button"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggle"
    >
      <Sun v-if="isDark" :size="18" />
      <Moon v-else :size="18" />
    </button>

    <template #fallback>
      <span class="theme-toggle" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";

const { isDark, sync, toggle } = useTheme();

onMounted(sync);
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.6rem;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.theme-toggle:hover {
  color: var(--text-primary);
  background: var(--surface-muted);
}
</style>
