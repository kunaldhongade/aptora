import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: ".", // Explicitly set root to current directory
  publicDir: "public", // Explicitly set public directory
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - split more aggressively for Vercel
          if (id.includes("node_modules")) {
            // React ecosystem
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("react-router")) {
              return "router-vendor";
            }
            // UI libraries
            if (id.includes("framer-motion")) {
              return "motion-vendor";
            }
            if (id.includes("lucide-react")) {
              return "icons-vendor";
            }
            // Aptos wallet libraries (often large)
            if (id.includes("@aptos-labs") || id.includes("aptos")) {
              return "aptos-vendor";
            }
            // HTTP and utilities
            if (id.includes("axios")) {
              return "http-vendor";
            }
            if (id.includes("clsx") || id.includes("tailwind")) {
              return "utils-vendor";
            }
            // Crypto and wallet related (often large)
            if (
              id.includes("crypto") ||
              id.includes("wallet") ||
              id.includes("petra") ||
              id.includes("martian")
            ) {
              return "crypto-vendor";
            }
            // All other node_modules - split into smaller chunks
            if (
              id.includes("lodash") ||
              id.includes("moment") ||
              id.includes("date-fns")
            ) {
              return "utility-vendor";
            }
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
    chunkSizeWarningLimit: 5000, // Set to 5MB to suppress warnings for Aptos libraries
    target: "esnext",
    minify: "esbuild", // Use esbuild instead of terser
    sourcemap: false, // Disable sourcemaps for production to reduce bundle size
    reportCompressedSize: false, // Skip compressed size reporting for faster builds
  },
});
