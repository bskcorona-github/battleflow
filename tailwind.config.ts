import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        "primary-light": "var(--primary-light)",
        secondary: "var(--secondary)",
        "secondary-light": "var(--secondary-light)",
        accent: "var(--accent)",
        background: "var(--background)",
        "background-alt": "var(--background-alt)",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",
        success: "var(--success)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["Noto Sans JP", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "var(--card-shadow)",
        "card-hover": "var(--card-shadow-hover)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
  darkMode: "class", // or 'media' to respect system preferences
} satisfies Config;
