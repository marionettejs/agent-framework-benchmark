import { defineConfig } from "vite";
export default defineConfig({
  define: {
    "import.meta.env.API_BASE_URL": JSON.stringify(
      process.env.API_BASE_URL || "http://localhost:9000",
    ),
  },
});
