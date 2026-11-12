export default defineNuxtConfig({
  compatibilityDate: "2026-11-05",
  css: ["~/assets/tokens.css", "~/assets/main.css"],
  devtools: { enabled: false },
  app: { head: { htmlAttrs: { lang: "en" } } },
});
