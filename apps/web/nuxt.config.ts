import tailwindcss from "@tailwindcss/vite";
// https://nuxt.com/docs/api/configuration/nuxt-config

const description =
  "Griot lives in your Slack workspace. It remembers what your team decided, answers from what you've taught it, pushes back on contradictions, and never forgets a task.";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  modules: ["@nuxt/eslint"],

  app: {
    head: {
      title: "Griot — an AI teammate with institutional memory",
      htmlAttrs: { lang: "en" },
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover",
        },
        { name: "description", content: description },
        {
          name: "keywords",
          content:
            "slack bot, ai teammate, institutional memory, team knowledge base, decision log, cockroachdb, rag",
        },
        { name: "theme-color", content: "#b45309" },
        { name: "author", content: "Deevyn Ifunanya" },

        // Open Graph
        { property: "og:site_name", content: "Griot" },
        { property: "og:type", content: "website" },
        {
          property: "og:title",
          content: "Griot — an AI teammate with institutional memory",
        },
        { property: "og:description", content: description },

        // Twitter Card
        { name: "twitter:card", content: "summary" },
        {
          name: "twitter:title",
          content: "Griot — an AI teammate with institutional memory",
        },
        { name: "twitter:description", content: description },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      script: [
        {
          // Apply the saved (or system) theme before first paint — avoids a light-mode flash.
          innerHTML:
            '(function(){try{var t=localStorage.getItem("griot-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();',
        },
      ],
    },
  },

  devServer: {
    port: 3100,
    host: "0.0.0.0",
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["lucide-vue-next"],
    },
  },

  // ── Env vars (mirror them in .env.example) ──
  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_SITE_URL — canonical base URL of this site.
      siteUrl: "",
      // Overridden by NUXT_PUBLIC_BASE_URL — the deployed API base (sst
      // output `api`). Everything hangs off it: the "Add to Slack" href is
      // `${baseUrl}/slack/install`, the demo chat POSTs to `${baseUrl}/chat`.
      // Empty → install button falls back to "#" and the widget hides.
      baseUrl: "",
    },
  },

  typescript: {
    typeCheck: true,
  },
  components: true,
  css: ["~/assets/css/main.css"],
});
