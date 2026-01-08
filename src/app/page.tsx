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
    console.log("Winner modal check - FULL DATA:", lastSettledRound);
    console.log("Winner modal check:", {
      hasData: !!lastSettledRound,
      keys: lastSettledRound ? Object.keys(lastSettledRound) : [],
      roundId: lastSettledRound?.round?.id,
      lastShownRoundId: lastShownRoundId.current,
    });

    if (lastSettledRound?.round?.id && lastSettledRound.round.id !== lastShownRoundId.current) {
      // New settled round detected - show the modal
      console.log("Showing winner modal for round:", lastSettledRound.round.id);
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
          <h1 className="font-heading text-4xl md:text-6xl font-black gradient-text mb-4 animate-shimmer">
            Predict. Stake. Win.
          </h1>
          <p className="text-slate-light text-lg md:text-xl max-w-2xl mx-auto">
            Select the token you believe will outperform. Winners share the pool.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            <div className="flex items-center gap-2 text-gold">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-sm">0.1 - 5 SOL stakes</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="text-teal text-sm">10% platform fee</div>
            <span className="text-white/20">|</span>
            <div className="text-gold text-sm">{ROUND_DURATION_MS / 60000}min rounds</div>
            <span className="text-white/20">|</span>
            <div className="text-gold text-sm">{BETTING_WINDOW_MS / 60000}min staking window</div>
          </div>
          <p className="text-slate text-xs mt-4">
            6 tokens selected from top 30 Solana coins by 24h volume
          </p>
          {/* Token CA */}
          <div className="mt-6 inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2">
            <span className="text-gold font-heading text-sm">CA:</span>
            <span className="text-slate-light text-sm font-mono">Coming Soon</span>
          </div>
        </section>

        {/* Betting Status Banner */}
        <section className="mb-6">
          {betting.status === "open" && (
            <div className={`glass-card p-4 border-l-4 ${betting.target === "next" ? "border-gold bg-gold/5" : "border-teal"}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full animate-pulse ${betting.target === "next" ? "bg-gold" : "bg-teal"}`} />
                  <span className={`font-heading font-bold ${betting.target === "next" ? "text-gold" : "text-teal"}`}>
                    {betting.target === "next" ? "STAKING OPEN - NEXT ROUND" : "STAKING OPEN - CURRENT ROUND"}
                  </span>
                </div>
                {betting.endsIn && betting.endsIn > 0 && (
                  <div className="text-slate-light text-sm">
                    Staking closes in: <span className="text-gold font-mono font-bold">{formatTimeRemaining(betting.endsIn)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {betting.status === "locked" && liveRound && (
            <div className="glass-card p-4 border-l-4 border-gold bg-gold/5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <span className="font-heading text-gold font-bold">STAKING LOCKED</span>
                    <p className="text-slate-light text-sm">Tracking prices - next round opens in {formatTimeRemaining(liveRound.endTime - Date.now())}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Live Round Status Bar */}
        {liveRound && (
          <section className="mb-6">
            <div className="glass-card p-4 border-l-4 border-teal">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-teal rounded-full animate-pulse" />
                  <span className="font-heading text-teal font-bold">LIVE ROUND</span>
                  <span className="text-slate text-sm">({liveRound.id.slice(-8)})</span>
                </div>
                <Countdown endTime={liveRound.endTime} compact />
                <div className="text-slate-light text-sm">
                  Pool: <span className="text-gold font-mono">{liveRound.totalPool.toFixed(2)} SOL</span>
                  {" | "}
                  Stakes: <span className="text-gold font-mono">{liveRound.bets.length}</span>
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
                <h3 className="font-heading text-sm text-slate-light mb-3 uppercase tracking-wider">
                  Round Ends In
                </h3>
                <Countdown endTime={liveRound.endTime} />
                {betting.status === "locked" && (
                  <p className="text-gold text-xs mt-3">
                    Staking locked - tracking prices
                  </p>
                )}
              </div>
            )}

            {/* No Round State */}
            {!liveRound && !nextRound && (
              <div className="glass-card p-6 text-center">
                <h3 className="font-heading text-sm text-slate-light mb-3 uppercase tracking-wider">
                  Round Status
                </h3>
                <div className="text-gold font-heading text-xl animate-pulse">
                  No Active Round
                </div>
                <p className="text-slate text-sm mt-2">
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
                <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-light">Loading token prices...</p>
              </div>
            ) : !liveRound && !nextRound ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-4">🎲</div>
                <h2 className="font-heading text-2xl font-bold text-gold mb-2">
                  No Active Round
                </h2>
                <p className="text-slate-light">
                  Waiting for the next round to start. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Live Round - Always show when exists */}
                {liveRound && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading text-lg font-bold">
                        <span className={betting.target === "next" || betting.status === "locked" ? "text-gold" : "text-teal"}>
                          {betting.target === "next" ? "Live Round (Watching Prices)" :
                           betting.status === "locked" ? "Current Round (Staking Locked)" : "Current Round"}
                        </span>
                      </h2>
                      {betting.target !== "next" && betting.status === "open" && betting.endsIn && betting.endsIn > 0 && (
                        <span className="text-xs text-slate bg-teal/10 px-3 py-1 rounded-full">
                          Staking closes in {formatTimeRemaining(betting.endsIn)}
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
                  <div className="space-y-4 pt-4 border-t border-gold/30">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading text-lg font-bold">
                        <span className="text-gold">Next Round (Staking Open)</span>
                      </h2>
                      {betting.endsIn && betting.endsIn > 0 && (
                        <span className="text-xs text-slate bg-gold/10 px-3 py-1 rounded-full">
                          Staking closes in {formatTimeRemaining(betting.endsIn)}
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
                  <div className="glass-card p-6 border border-gold/30">
                    <h3 className="font-heading text-lg font-bold text-gold mb-4">
                      Next Round Preview
                    </h3>
                    <p className="text-slate-light text-sm mb-4">
                      These tokens will be in the next round. Betting opens soon.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {nextRound.tokens.map((token) => (
                        <div key={token.symbol} className="bg-navy-light rounded-lg p-3 text-center">
                          <div className="text-2xl mb-1">{token.image ? "🪙" : "🎰"}</div>
                          <div className="text-gold font-bold text-sm">{token.symbol}</div>
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
            {/* How It Works */}
            <div className="glass-card p-4">
              <h3 className="font-heading text-sm text-slate-light mb-3 uppercase tracking-wider">
                How It Works
              </h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gold font-bold">1.</span>
                  <span className="text-white/80">Connect your Solana wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold font-bold">2.</span>
                  <span className="text-white/80">Select a token you predict will outperform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold font-bold">3.</span>
                  <span className="text-white/80">Choose your stake (0.1 - 5 SOL)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold font-bold">4.</span>
                  <span className="text-white/80">Wait for {ROUND_DURATION_MS / 60000}min round to end</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold font-bold">5.</span>
                  <span className="text-gold">Winners split 90% of the pool!</span>
                </li>
              </ol>
              <div className="mt-4 p-2 bg-gold/10 rounded text-xs text-slate-light">
                <strong className="text-gold">Fair Play:</strong> Staking closes {BETTING_WINDOW_MS / 60000} min after round starts - no last-second advantage!
              </div>
              <div className="mt-2 p-2 bg-gold/10 rounded text-xs text-slate-light">
                <strong className="text-gold">Min 2 Players:</strong> Rounds need 2+ unique participants to play. Less than 2? Full refund, no fee!
              </div>
            </div>

            {/* Payout Formula */}
            <div className="glass-card p-4">
              <h3 className="font-heading text-sm text-slate-light mb-3 uppercase tracking-wider">
                Payout Formula
              </h3>
              <div className="bg-navy-light rounded-lg p-3 mb-3">
                <code className="text-gold text-xs font-mono block text-center">
                  Your Payout = (Your Stake ÷ Total Winning Stakes) × Prize Pool
                </code>
              </div>
              <div className="space-y-2 text-xs text-slate-light">
                <p>
                  <span className="text-teal font-semibold">Prize Pool</span> = Total Pool × 90%
                </p>
                <p className="text-slate">
                  The 10% fee is taken from the <span className="text-slate-light">total pool</span>, not from individual bets.
                  Winners split the remaining 90% proportionally based on their bet size.
                </p>
              </div>
              <div className="mt-3 p-2 bg-gold/10 rounded text-xs">
                <strong className="text-gold">Example:</strong>
                <span className="text-slate-light"> Pool is 10 SOL. You bet 1 SOL on the winner, others bet 1 SOL too (2 SOL total on winner). Prize pool is 9 SOL. Your payout = (1÷2) × 9 = 4.5 SOL</span>
              </div>
            </div>

            {/* Start Prices */}
            {liveRound && liveRound.tokens && (
              <div className="glass-card p-4">
                <h3 className="font-heading text-sm text-slate-light mb-3 uppercase tracking-wider">
                  Live Round Start Prices
                </h3>
                <div className="space-y-2">
                  {liveRound.tokens.map((token) => (
                    <div key={token.symbol} className="flex justify-between text-sm">
                      <span className="text-white/80">{token.symbol}</span>
                      <span className="font-mono text-gold">
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
            <p className="text-slate text-sm">
              <span className="text-teal">Risk Notice:</span> This is a prediction market with real stakes.
              Only stake what you can afford to lose.
            </p>
            <p className="text-white/30 text-xs mt-2">
              Prices from DexScreener | {ROUND_DURATION_MS / 60000}min rounds | {BETTING_WINDOW_MS / 60000}min staking window | 0.1-5 SOL bets
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
