import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F5F4",
        ink: "#0F1B17",
        muted: "#5B6B65",
        line: "#DDE3E0",
        brand: { DEFAULT: "#0B5D4B", dark: "#073B30", soft: "#E6F2EE" },
        danger: "#B42318",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;