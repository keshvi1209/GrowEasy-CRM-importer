import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F6F3",
        graphite: {
          900: "#1A1F1C",
          800: "#242B26",
          700: "#3A4640",
          600: "#586359",
          500: "#7C877D",
          400: "#A4ACA0",
          300: "#CBD0C6",
          200: "#E2E5DD",
          100: "#EDEFE9",
        },
        teal: {
          900: "#0B3F38",
          700: "#0F7B6C",
          600: "#149B85",
          500: "#1BB79D",
          200: "#C3EBE1",
          100: "#E4F5EF",
        },
        amber: {
          700: "#8A5A05",
          500: "#D98E04",
          200: "#F5DFAE",
          100: "#FBF0DA",
        },
        rust: {
          700: "#8C3A25",
          500: "#C0432E",
          200: "#F0CFC5",
          100: "#FAECE7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
