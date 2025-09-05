/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3DD1FF",
        "primary-600": "#2AB8E6",
        accent: "#A28BFF",
        "bg-900": "#060712",
        "bg-800": "#0D1116",
        "surface-700": "#0F1720",
        muted: "#9AA7B2",
        success: "#27D08A",
        warning: "#FFB86B",
        danger: "#FF6B6B",
        "text-default": "#E6F0F6",
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
        glow: "0 0 20px rgba(61, 209, 255, 0.15)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
