import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // StakePool - Navy + Gold + Teal
        navy: {
          DEFAULT: "#0D1B2A",
          dark: "#070F18",
          light: "#1B3A5F",
          muted: "#152238",
        },
        gold: {
          DEFAULT: "#F0B429",
          light: "#FFCE54",
          dark: "#C9941F",
          muted: "#8B7355",
        },
        teal: {
          DEFAULT: "#0ED2B9",
          light: "#3EEBD4",
          dark: "#0AA895",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
          dark: "#7C3AED",
        },
        slate: {
          DEFAULT: "#64748B",
          light: "#94A3B8",
          dark: "#475569",
        },
        accent: {
          green: "#10B981",
          red: "#EF4444",
        },
      },
      fontFamily: {
        heading: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-glow-teal": "pulse-glow-teal 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "ticker": "ticker 20s linear infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(240, 180, 41, 0.3), 0 0 40px rgba(240, 180, 41, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(240, 180, 41, 0.5), 0 0 60px rgba(240, 180, 41, 0.2)",
          },
        },
        "pulse-glow-teal": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(14, 210, 185, 0.3), 0 0 40px rgba(14, 210, 185, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(14, 210, 185, 0.5), 0 0 60px rgba(14, 210, 185, 0.2)",
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "ticker": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "shimmer": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": "linear-gradient(rgba(14, 210, 185, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 210, 185, 0.03) 1px, transparent 1px)",
        "gradient-gold-teal": "linear-gradient(135deg, #F0B429 0%, #0ED2B9 100%)",
        "gradient-violet-teal": "linear-gradient(135deg, #8B5CF6 0%, #0ED2B9 100%)",
      },
      boxShadow: {
        "gold": "0 0 20px rgba(240, 180, 41, 0.4), 0 0 40px rgba(240, 180, 41, 0.1)",
        "gold-lg": "0 0 30px rgba(240, 180, 41, 0.5), 0 0 60px rgba(240, 180, 41, 0.2)",
        "teal": "0 0 20px rgba(14, 210, 185, 0.4), 0 0 40px rgba(14, 210, 185, 0.1)",
        "teal-lg": "0 0 30px rgba(14, 210, 185, 0.5), 0 0 60px rgba(14, 210, 185, 0.2)",
        "violet": "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.1)",
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
