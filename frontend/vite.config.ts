import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }
            if (id.includes("framer-motion") || id.includes("lucide-react")) {
              return "ui-vendor";
            }
            if (id.includes("axios") || id.includes("clsx")) {
              return "utils-vendor";
            }
            // All other node_modules
            return "vendor";
          }

          // Feature chunks based on file paths
          if (id.includes("/pages/Auth") || id.includes("/components/auth/")) {
            return "auth";
          }
          if (
            id.includes("/pages/Dashboard") ||
            id.includes("/pages/Trade") ||
            id.includes("/pages/Markets") ||
            id.includes("/pages/Orders")
          ) {
            return "trading";
          }
          if (
            id.includes("/pages/Social") ||
            id.includes("/pages/Leaderboard") ||
            id.includes("/pages/Profile")
          ) {
            return "social";
          }
          if (id.includes("/pages/Vaults") || id.includes("/pages/Referrals")) {
            return "vaults";
          }
          if (id.includes("/lib/api/")) {
            return "api";
          }
          if (id.includes("/components/")) {
            return "components";
          }
        },
      },
    },
    chunkSizeWarningLimit: 800, // Set to 800KB
    target: "esnext",
    minify: "esbuild", // Use esbuild instead of terser
  },
});
