<template>
  <div>
    <SiteHeader />
    <slot />
    <SiteFooter />
    <!-- Client-only: the widget keys its session off sessionStorage. -->
    <ClientOnly>
      <LazyChatWidget />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
