"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { BettingGrid } from "@/components/BettingGrid";
import { Countdown } from "@/components/Countdown";
import { ActivityTicker } from "@/components/ActivityTicker";
import { Leaderboard } from "@/components/Leaderboard";
import { PoolInfo } from "@/components/PoolInfo";
import { WinnerModal } from "@/components/WinnerModal";
import { usePrices } from "@/hooks/usePrices";
import { useRound } from "@/hooks/useRound";
import { ROUND_DURATION_MS, BETTING_WINDOW_MS, RoundHistoryEntry } from "@/lib/storage";

export default function Home() {
  const { prices, isLoading: pricesLoading } = usePrices();
  const {
    liveRound,
    nextRound,
    liveBetCounts,
    nextBetCounts,
    activity,
    lastSettledRound,
    betting,
    refresh: refreshRound,
  } = useRound();

  // Track the last shown winner modal to avoid showing it multiple times
  const lastShownRoundId = useRef<string | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [modalRound, setModalRound] = useState<RoundHistoryEntry | null>(null);

  // Show winner modal when a new round settles
  useEffect(() => {
    if (lastSettledRound?.round?.id && lastSettledRound.round.id !== lastShownRoundId.current) {
      // New settled round detected - show the modal
      setModalRound(lastSettledRound);
      setShowWinnerModal(true);
      lastShownRoundId.current = lastSettledRound.round.id;
    }
  }, [lastSettledRound]);

  const handleCloseWinnerModal = () => {
    setShowWinnerModal(false);
  };

  const handleBetPlaced = () => {
    refreshRound();
  };

  // Determine which round to show for betting
  const bettingRound = betting.target === "next" ? nextRound : liveRound;

  // Format time for display
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-8 pt-8">
          <h1 className="font-orbitron text-4xl md:text-6xl font-black gradient-text mb-4 animate-neon-flicker">
            ROLL THE DICE
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
            Pick the memecoin that pumps hardest. Winner takes all.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            <div className="flex items-center gap-2 text-neon-cyan">
              <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
              <span className="text-sm">0.1 - 5 SOL bets</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="text-neon-pink text-sm">10% platform fee</div>
            <span className="text-white/20">|</span>
            <div className="text-neon-orange text-sm">{ROUND_DURATION_MS / 60000}min rounds</div>
            <span className="text-white/20">|</span>
            <div className="text-neon-purple text-sm">{BETTING_WINDOW_MS / 60000}min betting window</div>
          </div>
          <p className="text-white/40 text-xs mt-4">
            6 random tokens from top 30 Solana coins by 24h volume
          </p>
          {/* Token CA */}
          <div className="mt-6 inline-flex items-center gap-2 bg-neon-purple/10 border border-neon-purple/30 rounded-full px-4 py-2">
            <span className="text-neon-purple font-orbitron text-sm">CA:</span>
            <span className="text-white/60 text-sm font-mono">Coming Soon</span>
          </div>
        </section>

        {/* Betting Status Banner */}
        <section className="mb-6">
          {betting.status === "open" && (
            <div className={`glass-card p-4 border-l-4 ${betting.target === "next" ? "border-neon-cyan bg-neon-cyan/5" : "border-neon-pink"}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full animate-pulse ${betting.target === "next" ? "bg-neon-cyan" : "bg-neon-pink"}`} />
                  <span className={`font-orbitron font-bold ${betting.target === "next" ? "text-neon-cyan" : "text-neon-pink"}`}>
                    {betting.target === "next" ? "BETTING OPEN - NEXT ROUND" : "BETTING OPEN - CURRENT ROUND"}
                  </span>
                </div>
                {betting.endsIn && betting.endsIn > 0 && (
                  <div className="text-white/60 text-sm">
                    Betting closes in: <span className="text-neon-orange font-mono font-bold">{formatTimeRemaining(betting.endsIn)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {betting.status === "locked" && liveRound && (
            <div className="glass-card p-4 border-l-4 border-neon-orange bg-neon-orange/5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <span className="font-orbitron text-neon-orange font-bold">BETTING LOCKED</span>
                    <p className="text-white/60 text-sm">Watching prices - next round opens in {formatTimeRemaining(liveRound.endTime - Date.now())}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Live Round Status Bar */}
        {liveRound && (
          <section className="mb-6">
            <div className="glass-card p-4 border-l-4 border-neon-pink">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-neon-pink rounded-full animate-pulse" />
                  <span className="font-orbitron text-neon-pink font-bold">LIVE ROUND</span>
                  <span className="text-white/40 text-sm">({liveRound.id.slice(-8)})</span>
                </div>
                <Countdown endTime={liveRound.endTime} compact />
                <div className="text-white/60 text-sm">
                  Pool: <span className="text-neon-cyan font-mono">{liveRound.totalPool.toFixed(2)} SOL</span>
                  {" | "}
                  Bets: <span className="text-neon-purple font-mono">{liveRound.bets.length}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Left */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            {/* Timer Card */}
            {liveRound && (
              <div className="glass-card p-6 text-center">
                <h3 className="font-orbitron text-sm text-white/60 mb-3 uppercase tracking-wider">
                  Round Ends In
                </h3>
                <Countdown endTime={liveRound.endTime} />
                {betting.status === "locked" && (
                  <p className="text-neon-orange text-xs mt-3">
                    Betting locked - watching prices
                  </p>
                )}
              </div>
            )}

            {/* No Round State */}
            {!liveRound && !nextRound && (
              <div className="glass-card p-6 text-center">
                <h3 className="font-orbitron text-sm text-white/60 mb-3 uppercase tracking-wider">
                  Round Status
                </h3>
                <div className="text-neon-orange font-orbitron text-xl animate-pulse">
                  No Active Round
                </div>
                <p className="text-white/40 text-sm mt-2">
                  Waiting for next round...
                </p>
              </div>
            )}

            {/* Pool Info */}
            <PoolInfo
              totalPool={bettingRound?.totalPool || 0}
              totalBets={bettingRound?.bets.length || 0}
              roundId={bettingRound?.id}
              status={bettingRound?.status}
            />
          </div>

          {/* Main Content - Center */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {pricesLoading ? (
              <div className="glass-card p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-white/60">Loading token prices...</p>
              </div>
            ) : !liveRound && !nextRound ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-4">🎲</div>
                <h2 className="font-orbitron text-2xl font-bold text-neon-orange mb-2">
                  No Active Round
                </h2>
                <p className="text-white/60">
                  Waiting for the next round to start. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Live Round - Always show when exists */}
                {liveRound && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-orbitron text-lg font-bold">
                        <span className={betting.target === "next" || betting.status === "locked" ? "text-neon-orange" : "text-neon-pink"}>
                          {betting.target === "next" ? "Live Round (Watching Prices)" :
                           betting.status === "locked" ? "Current Round (Betting Locked)" : "Current Round"}
                        </span>
                      </h2>
                      {betting.target !== "next" && betting.status === "open" && betting.endsIn && betting.endsIn > 0 && (
                        <span className="text-xs text-white/40 bg-neon-pink/10 px-3 py-1 rounded-full">
                          Betting closes in {formatTimeRemaining(betting.endsIn)}
                        </span>
                      )}
                    </div>

                    <BettingGrid
                      prices={prices}
                      tokens={liveRound.tokens}
                      betCounts={liveBetCounts}
                      onBetPlaced={handleBetPlaced}
                      roundId={liveRound.id}
                      roundStatus={betting.target === "next" || betting.status === "locked" ? "settled" : "live"}
                    />
                  </div>
                )}

                {/* Next Round - Show with betting when preview is open */}
                {nextRound && betting.target === "next" && (
                  <div className="space-y-4 pt-4 border-t border-neon-cyan/30">
                    <div className="flex items-center justify-between">
                      <h2 className="font-orbitron text-lg font-bold">
                        <span className="text-neon-cyan">Next Round (Betting Open)</span>
                      </h2>
                      {betting.endsIn && betting.endsIn > 0 && (
                        <span className="text-xs text-white/40 bg-neon-cyan/10 px-3 py-1 rounded-full">
                          Betting closes in {formatTimeRemaining(betting.endsIn)}
                        </span>
                      )}
                    </div>

                    <BettingGrid
                      prices={prices}
                      tokens={nextRound.tokens}
                      betCounts={nextBetCounts}
                      onBetPlaced={handleBetPlaced}
                      roundId={nextRound.id}
                      roundStatus="betting"
                    />
                  </div>
                )}

                {/* Next Round Preview (when betting is NOT open yet) */}
                {nextRound && betting.target !== "next" && betting.status === "locked" && (
                  <div className="glass-card p-6 border border-neon-cyan/30">
                    <h3 className="font-orbitron text-lg font-bold text-neon-cyan mb-4">
                      Next Round Preview
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      These tokens will be in the next round. Betting opens soon.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {nextRound.tokens.map((token) => (
                        <div key={token.symbol} className="bg-void-light rounded-lg p-3 text-center">
                          <div className="text-2xl mb-1">{token.image ? "🪙" : "🎰"}</div>
                          <div className="text-neon-cyan font-bold text-sm">{token.symbol}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Right */}
          <div className="lg:col-span-1 space-y-6 order-3">
            {/* How to Play */}
            <div className="glass-card p-4">
              <h3 className="font-orbitron text-sm text-white/60 mb-3 uppercase tracking-wider">
                How to Play
              </h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-neon-purple font-bold">1.</span>
                  <span className="text-white/80">Connect your Phantom wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-purple font-bold">2.</span>
                  <span className="text-white/80">Pick a memecoin you think will pump</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-purple font-bold">3.</span>
                  <span className="text-white/80">Choose your bet (0.1 - 5 SOL)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-purple font-bold">4.</span>
                  <span className="text-white/80">Wait for {ROUND_DURATION_MS / 60000}min round to end</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan font-bold">5.</span>
                  <span className="text-neon-cyan">Winners split 90% of the pool!</span>
                </li>
              </ol>
              <div className="mt-4 p-2 bg-neon-orange/10 rounded text-xs text-white/60">
                <strong className="text-neon-orange">Fair Play:</strong> Betting closes {BETTING_WINDOW_MS / 60000} min after round starts - no last-second advantage!
              </div>
              <div className="mt-2 p-2 bg-neon-cyan/10 rounded text-xs text-white/60">
                <strong className="text-neon-cyan">Min 2 Players:</strong> Rounds need 2+ unique bettors to play. Less than 2? Full refund, no fee!
              </div>
            </div>

            {/* Winnings Formula */}
            <div className="glass-card p-4">
              <h3 className="font-orbitron text-sm text-white/60 mb-3 uppercase tracking-wider">
                Winnings Formula
              </h3>
              <div className="bg-void-light rounded-lg p-3 mb-3">
                <code className="text-neon-cyan text-xs font-mono block text-center">
                  Your Payout = (Your Bet ÷ Total Winning Bets) × Prize Pool
                </code>
              </div>
              <div className="space-y-2 text-xs text-white/60">
                <p>
                  <span className="text-neon-pink font-semibold">Prize Pool</span> = Total Pool × 90%
                </p>
                <p className="text-white/40">
                  The 10% fee is taken from the <span className="text-white/60">total pool</span>, not from individual bets.
                  Winners split the remaining 90% proportionally based on their bet size.
                </p>
              </div>
              <div className="mt-3 p-2 bg-neon-purple/10 rounded text-xs">
                <strong className="text-neon-purple">Example:</strong>
                <span className="text-white/60"> Pool is 10 SOL. You bet 1 SOL on the winner, others bet 1 SOL too (2 SOL total on winner). Prize pool is 9 SOL. Your payout = (1÷2) × 9 = 4.5 SOL</span>
              </div>
            </div>

            {/* Start Prices */}
            {liveRound && liveRound.tokens && (
              <div className="glass-card p-4">
                <h3 className="font-orbitron text-sm text-white/60 mb-3 uppercase tracking-wider">
                  Live Round Start Prices
                </h3>
                <div className="space-y-2">
                  {liveRound.tokens.map((token) => (
                    <div key={token.symbol} className="flex justify-between text-sm">
                      <span className="text-white/80">{token.symbol}</span>
                      <span className="font-mono text-neon-purple">
                        ${(liveRound.startPrices[token.symbol] || 0).toFixed(8)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Ticker */}
        <section className="mt-8">
          <ActivityTicker initialBets={activity} />
        </section>

        {/* Leaderboard */}
        <section className="mt-12">
          <Leaderboard />
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="glass-card p-6 inline-block">
            <p className="text-white/40 text-sm">
              <span className="text-neon-pink">Warning:</span> This is a high-risk gambling game.
              Only bet what you can afford to lose. Not financial advice.
            </p>
            <p className="text-white/30 text-xs mt-2">
              Prices from DexScreener | {ROUND_DURATION_MS / 60000}min rounds | {BETTING_WINDOW_MS / 60000}min betting window | 0.1-5 SOL bets
            </p>
          </div>
        </footer>
      </main>

      {/* Winner Announcement Modal */}
      {showWinnerModal && modalRound && (
        <WinnerModal
          settledRound={modalRound}
          onClose={handleCloseWinnerModal}
        />
      )}
    </div>
  );
}
