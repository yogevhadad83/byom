import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal Vite config:
// - Plugins: React
// - Dev-only proxy to avoid CORS when calling the SaaS from the Vite dev server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.SAAS_BASE_URL || "https://byom-api.onrender.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
