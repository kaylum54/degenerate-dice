"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { setSoundsEnabled, playSound } from "@/hooks/useSounds";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export function Header() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem("soundEnabled");
    if (saved !== null) {
      const enabled = saved === "true";
      setSoundEnabled(enabled);
      setSoundsEnabled(enabled);
    }
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    setSoundsEnabled(newValue);
    localStorage.setItem("soundEnabled", String(newValue));
    if (newValue) {
      playSound("click");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-neon-purple/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="text-4xl animate-dice-roll">🎲</div>
              <div className="absolute inset-0 blur-lg bg-neon-purple/50 animate-pulse-glow" />
            </div>
            <div>
              <h1 className="font-orbitron text-xl md:text-2xl font-bold gradient-text animate-neon-flicker">
                DEGENERATE DICE
              </h1>
              <p className="text-xs text-neon-cyan/70 hidden sm:block">
                Bet on the pump. Winner takes all.
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-white/80 hover:text-neon-cyan transition-colors font-mono text-sm"
            >
              Play
            </Link>
            <Link
              href="#leaderboard"
              className="text-white/80 hover:text-neon-cyan transition-colors font-mono text-sm"
            >
              Leaderboard
            </Link>
          </nav>

          {/* Sound Toggle & Wallet Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-void-light border border-white/10 hover:border-neon-cyan/50 transition-all"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neon-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
            <div className="wallet-adapter-button-trigger">
              <WalletMultiButton className="!bg-gradient-to-r !from-neon-purple !to-neon-pink !rounded-lg !font-orbitron !text-sm !h-10 hover:!shadow-neon-pink !transition-all" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
