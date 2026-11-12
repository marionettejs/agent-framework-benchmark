export default defineNuxtConfig({
  compatibilityDate: "2026-11-05",
  css: ["~/assets/tokens.css", "~/assets/style.css"],
  app: { head: { htmlAttrs: { lang: "en" } } },
  runtimeConfig: {
    apiBase: process.env.API_BASE_URL || "http://localhost:9000",
  },
});
