"use client";

import { useEffect, useState } from "react";
import { RoundHistoryEntry } from "@/lib/storage";
import { playSound } from "@/hooks/useSounds";

interface WinnerModalProps {
  settledRound: RoundHistoryEntry | null;
  onClose: () => void;
}

export function WinnerModal({ settledRound, onClose }: WinnerModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in and play sound
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Play appropriate sound based on result
      if (settledRound?.round?.winner === "REFUNDED") {
        playSound("error");
      } else {
        playSound("roundEnd");
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [settledRound]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!settledRound) return null;

  const { round, priceChanges, payouts } = settledRound;
  const isRefunded = round.winner === "REFUNDED";

  // Find the winning token info
  const winningToken = round.tokens.find((t) => t.symbol === round.winner);
  const winningPriceChange = priceChanges.find((p) => p.symbol === round.winner);

  // Calculate winner count
  const winnerCount = payouts.length;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? "bg-black/80 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleClose}
    >
      <div
        className={`glass-card max-w-md w-full p-6 transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isRefunded ? (
          // Refunded round display
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔄</div>
              <h2 className="font-orbitron text-2xl font-bold text-neon-orange mb-2">
                ROUND REFUNDED
              </h2>
              <p className="text-white/60">
                Not enough players joined this round
              </p>
            </div>

            <div className="bg-void-light rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">All bets have been refunded</p>
                <p className="text-neon-cyan font-mono text-lg">
                  {round.totalPool.toFixed(2)} SOL returned
                </p>
              </div>
            </div>

            <p className="text-white/40 text-sm text-center mb-6">
              Minimum 2 unique players required per round
            </p>
          </>
        ) : (
          // Normal winner display
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">🏆</div>
              <h2 className="font-orbitron text-2xl font-bold gradient-text mb-2">
                ROUND COMPLETE!
              </h2>
              <p className="text-white/60">The winner has been decided</p>
            </div>

            {/* Winner Token */}
            <div className="bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 rounded-lg p-6 mb-6 border border-neon-cyan/30">
              <div className="flex items-center justify-center gap-4">
                {winningToken?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={winningToken.image}
                    alt={round.winner}
                    className="w-16 h-16 rounded-full border-2 border-neon-cyan"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="text-center">
                  <div className="font-orbitron text-3xl font-black text-neon-cyan">
                    {round.winner}
                  </div>
                  {winningPriceChange && (
                    <div
                      className={`text-lg font-bold ${
                        winningPriceChange.change >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {winningPriceChange.change >= 0 ? "+" : ""}
                      {winningPriceChange.change.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-void-light rounded-lg p-3 text-center">
                <div className="text-white/40 text-xs mb-1">Prize Pool</div>
                <div className="text-neon-pink font-mono font-bold">
                  {(round.totalPool * 0.9).toFixed(2)} SOL
                </div>
              </div>
              <div className="bg-void-light rounded-lg p-3 text-center">
                <div className="text-white/40 text-xs mb-1">Winners</div>
                <div className="text-neon-purple font-mono font-bold">
                  {winnerCount} {winnerCount === 1 ? "player" : "players"}
                </div>
              </div>
            </div>

            {/* Payout Notice */}
            <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4 mb-6">
              <p className="text-neon-cyan text-sm text-center font-medium">
                Winners will be paid out before the end of the next round
              </p>
            </div>

            {/* Price Changes */}
            {priceChanges.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2">
                  All Price Changes
                </h4>
                <div className="space-y-1">
                  {priceChanges
                    .sort((a, b) => b.change - a.change)
                    .map((pc) => (
                      <div
                        key={pc.symbol}
                        className={`flex justify-between text-sm ${
                          pc.symbol === round.winner
                            ? "text-neon-cyan font-bold"
                            : "text-white/60"
                        }`}
                      >
                        <span>
                          {pc.symbol === round.winner && "🏆 "}
                          {pc.symbol}
                        </span>
                        <span
                          className={
                            pc.change >= 0 ? "text-green-400" : "text-red-400"
                          }
                        >
                          {pc.change >= 0 ? "+" : ""}
                          {pc.change.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full bg-gradient-to-r from-neon-purple to-neon-pink text-white font-orbitron font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Continue Playing
        </button>
      </div>
    </div>
  );
}
