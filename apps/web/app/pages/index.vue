<template>
  <div>
    <HomeHero />
    <HomeProblem />
    <HomeMemory />
    <HomeConflictGuard />
    <HomeUsage />
    <HomeArchitecture />
    <HomeSelfHost />
    <HomeFaq />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Griot — an AI teammate with institutional memory",
  description:
    "Griot lives in your Slack workspace. It remembers what your team decided, answers from what you've taught it, pushes back on contradictions, never forgets a task, and researches the web when asked.",
});
</script>
