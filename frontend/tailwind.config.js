/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Professional Black + Green Trading Theme
        primary: "#10B981", // Green for primary actions (main brand color)
        "primary-600": "#059669", // Darker green for hover states
        accent: "#10B981", // Green accent for positive actions
        "accent-red": "#EF4444", // Red accent for negative actions

        // Background layers (darkest to lightest)
        "bg-900": "#000000", // Pure black background
        "bg-800": "#0A0A0A", // Slightly lighter black
        "surface-700": "#1A1A1A", // Card/surface backgrounds
        "surface-600": "#2A2A2A", // Elevated surfaces
        "surface-500": "#3A3A3A", // Interactive surfaces

        // Text colors
        "text-default": "#FFFFFF", // Pure white text
        muted: "#A1A1AA", // Gray text for secondary info
        "text-dim": "#71717A", // Dimmed text

        // Status colors (trading-specific)
        success: "#10B981", // Green for profits/buy
        warning: "#F59E0B", // Amber for warnings
        danger: "#EF4444", // Red for losses/sell

        // Trading-specific colors
        "buy-green": "#10B981", // Buy orders
        "sell-red": "#EF4444", // Sell orders
        neutral: "#6B7280", // Neutral states
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        "press-start": ["Press Start 2P", "system-ui"],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(16, 185, 129, 0.2)", // Primary glow is now green
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.2)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.2)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        "card-elevated":
          "0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
