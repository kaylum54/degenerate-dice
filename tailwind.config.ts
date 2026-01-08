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
        // Miami Vice Terminal Palette
        void: {
          DEFAULT: "#060111",
          light: "#0D0221",
        },
        neon: {
          purple: "#9D4EDD",
          pink: "#F72585",
          orange: "#FF6D00",
          cyan: "#00F5D4",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "scanline": "scanline 8s linear infinite",
        "ticker": "ticker 20s linear infinite",
        "neon-flicker": "neon-flicker 3s ease-in-out infinite",
        "dice-roll": "dice-roll 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(157, 78, 221, 0.5), 0 0 40px rgba(157, 78, 221, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(157, 78, 221, 0.8), 0 0 60px rgba(157, 78, 221, 0.5)",
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "ticker": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "neon-flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
          "52%": { opacity: "1" },
          "54%": { opacity: "0.9" },
        },
        "dice-roll": {
          "0%": { transform: "rotate(0deg) scale(0.8)" },
          "50%": { transform: "rotate(180deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": `linear-gradient(rgba(157, 78, 221, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(157, 78, 221, 0.1) 1px, transparent 1px)`,
      },
      boxShadow: {
        "neon-purple": "0 0 20px rgba(157, 78, 221, 0.5), 0 0 40px rgba(157, 78, 221, 0.3)",
        "neon-pink": "0 0 20px rgba(247, 37, 133, 0.5), 0 0 40px rgba(247, 37, 133, 0.3)",
        "neon-cyan": "0 0 20px rgba(0, 245, 212, 0.5), 0 0 40px rgba(0, 245, 212, 0.3)",
        "neon-orange": "0 0 20px rgba(255, 109, 0, 0.5), 0 0 40px rgba(255, 109, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
