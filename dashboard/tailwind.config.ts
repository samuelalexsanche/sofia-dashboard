import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          base:  "#06060e",
          card:  "#0c0c18",
          muted: "#10101f",
          hover: "#141428",
        },
        gold: {
          DEFAULT: "#c9933a",
          light:   "#e8b96d",
          muted:   "#7a5520",
          subtle:  "rgba(201,147,58,0.12)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          strong:  "rgba(255,255,255,0.12)",
          gold:    "rgba(201,147,58,0.3)",
        },
        txt: {
          primary:   "#ede8de",
          secondary: "#8b8599",
          muted:     "#4a4858",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger:  "#ef4444",
        purple:  "#8b5cf6",
        teal:    "#14b8a6",
      },
      boxShadow: {
        card:  "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        gold:  "0 0 20px rgba(201,147,58,0.15)",
        glow:  "0 0 40px rgba(201,147,58,0.08)",
      },
      backgroundImage: {
        "card-gradient":  "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)",
        "gold-gradient":  "linear-gradient(135deg, #c9933a 0%, #e8b96d 100%)",
        "hero-gradient":  "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,147,58,0.12) 0%, transparent 60%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in":    "fadeIn 0.4s ease",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
