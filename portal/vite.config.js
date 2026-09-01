import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the browser talks to the Vite dev server (same origin), and
// Vite proxies /api/* to Django — so no CORS setup is needed while coding.
// In production the portal calls the API absolutely (see .env.production).
const DEV_API = process.env.VITE_DEV_API || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  // The portal is served under /portal/ on your domain (e.g. ckpsca.in/portal).
  // If you host it at the root of its own subdomain instead, change this to "/".
  base: "/portal/",
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: DEV_API,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
