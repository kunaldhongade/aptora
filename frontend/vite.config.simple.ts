import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Minimal Vite config for Vercel deployment
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 5000,
    sourcemap: false,
  },
});
