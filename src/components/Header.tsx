"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export function Header() {
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

          {/* Wallet Button */}
          <div className="wallet-adapter-button-trigger">
            <WalletMultiButton className="!bg-gradient-to-r !from-neon-purple !to-neon-pink !rounded-lg !font-orbitron !text-sm !h-10 hover:!shadow-neon-pink !transition-all" />
          </div>
        </div>
      </div>
    </header>
  );
}
