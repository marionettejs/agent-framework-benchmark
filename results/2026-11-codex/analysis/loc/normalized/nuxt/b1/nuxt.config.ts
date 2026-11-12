export default defineNuxtConfig({
  pages: true,
  compatibilityDate: "2026-11-04",
  css: ["~/assets/tokens.css", "~/assets/main.css"],
  app: { head: { htmlAttrs: { lang: "en" } } },
  devtools: { enabled: false },
});
