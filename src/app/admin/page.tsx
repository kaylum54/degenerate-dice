"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Round, Bet, ROUND_DURATION_MS } from "@/lib/storage";
import { formatSOL, shortenAddress, formatTimestamp } from "@/lib/utils";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [liveRound, setLiveRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [endRoundResult, setEndRoundResult] = useState<{
    winner: string;
    changes: { symbol: string; change: number }[];
    payouts: { wallet: string; amount: number }[];
  } | null>(null);

  // Fetch current round
  const fetchRound = async () => {
    try {
      const response = await fetch("/api/round");
      const data = await response.json();
      setLiveRound(data.liveRound);
    } catch (error) {
      console.error("Failed to fetch round:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRound();
      const interval = setInterval(fetchRound, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      setIsAuthenticated(true);
    }
  };

  // Start live round
  const startLiveRound = async () => {
    setIsLoading(true);
    setMessage(null);
    setEndRoundResult(null);

    try {
      const response = await fetch("/api/admin/start-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        fetchRound();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to start live round" });
    } finally {
      setIsLoading(false);
    }
  };

  // End round
  const endRound = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/end-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setEndRoundResult({
          winner: data.winner,
          changes: data.changes,
          payouts: data.payouts,
        });
        fetchRound();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to end round" });
    } finally {
      setIsLoading(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 w-full max-w-md">
          <h1 className="font-orbitron text-2xl font-bold gradient-text mb-6 text-center">
            Admin Access
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-void-light border border-neon-purple/30 rounded-lg text-white focus:border-neon-cyan focus:outline-none"
                placeholder="Enter admin password"
              />
            </div>
            <button type="submit" className="btn-neon w-full">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">
          Admin Panel
        </h1>
        <p className="text-white/40 text-sm mb-8">
          {ROUND_DURATION_MS / 60000}min rounds
        </p>

        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === "success"
                ? "bg-neon-cyan/20 border border-neon-cyan text-neon-cyan"
                : "bg-neon-pink/20 border border-neon-pink text-neon-pink"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Round Controls */}
          <div className="glass-card p-6">
            <h2 className="font-orbitron text-xl font-bold text-white mb-4">
              Round Controls
            </h2>

            <div className="space-y-4">
              {/* Live Round Status */}
              <div className="p-4 bg-void-light rounded-lg">
                <div className="text-white/60 text-sm mb-2">Live Round</div>
                {liveRound ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse" />
                    <span className="text-neon-pink font-bold">In Progress</span>
                    <span className="text-white/40">({liveRound.id.slice(-8)})</span>
                  </div>
                ) : (
                  <div className="text-neon-orange font-bold">None</div>
                )}
              </div>

              {/* Stats */}
              {liveRound && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-void-light rounded-lg">
                    <div className="text-white/60 text-sm">Pool</div>
                    <div className="text-neon-pink font-mono font-bold">
                      {formatSOL(liveRound.totalPool)} SOL
                    </div>
                  </div>
                  <div className="p-4 bg-void-light rounded-lg">
                    <div className="text-white/60 text-sm">Bets</div>
                    <div className="text-neon-purple font-mono font-bold">
                      {liveRound.bets.length}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={startLiveRound}
                  disabled={isLoading || !!liveRound}
                  className="btn-neon w-full"
                >
                  {isLoading ? "Processing..." : "Start Live Round"}
                </button>
                <button
                  onClick={endRound}
                  disabled={isLoading || !liveRound}
                  className="w-full px-6 py-3 font-orbitron font-bold uppercase tracking-wider bg-neon-orange/20 border-2 border-neon-orange text-neon-orange rounded-lg transition-all hover:bg-neon-orange/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "End Live Round"}
                </button>
              </div>
            </div>
          </div>

          {/* End Round Results */}
          {endRoundResult && (
            <div className="glass-card p-6">
              <h2 className="font-orbitron text-xl font-bold text-white mb-4">
                Round Results
              </h2>

              <div className="space-y-4">
                {/* Winner */}
                <div className="p-4 bg-neon-cyan/10 border border-neon-cyan rounded-lg text-center">
                  <div className="text-white/60 text-sm mb-1">Winner</div>
                  <div className="text-neon-cyan text-2xl font-orbitron font-bold">
                    {endRoundResult.winner}
                  </div>
                </div>

                {/* Price Changes */}
                <div>
                  <h3 className="text-white/60 text-sm mb-2">Price Changes</h3>
                  <div className="space-y-1">
                    {endRoundResult.changes.map((c) => (
                      <div
                        key={c.symbol}
                        className="flex justify-between p-2 bg-void-light rounded"
                      >
                        <span
                          className={
                            c.symbol === endRoundResult.winner
                              ? "text-neon-cyan font-bold"
                              : "text-white/80"
                          }
                        >
                          {c.symbol}
                        </span>
                        <span
                          className={
                            c.change >= 0 ? "text-neon-cyan" : "text-neon-pink"
                          }
                        >
                          {c.change >= 0 ? "+" : ""}
                          {c.change.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payouts */}
                {endRoundResult.payouts.length > 0 && (
                  <div>
                    <h3 className="text-white/60 text-sm mb-2">Payouts</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {endRoundResult.payouts.map((p, i) => (
                        <div
                          key={i}
                          className="flex justify-between p-2 bg-void-light rounded"
                        >
                          <span className="text-neon-cyan font-mono">
                            {shortenAddress(p.wallet)}
                          </span>
                          <span className="text-neon-pink font-mono">
                            {formatSOL(p.amount)} SOL
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Bets */}
          <div className="glass-card p-6 lg:col-span-2">
            <h2 className="font-orbitron text-xl font-bold text-white mb-4">
              Current Bets
            </h2>

            <div className="mb-4">
              <span className="text-neon-pink font-bold">
                Total: {liveRound?.bets.length || 0}
              </span>
            </div>

            {!liveRound?.bets.length ? (
              <p className="text-white/40">No bets yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-white/40 text-sm border-b border-white/10">
                      <th className="pb-2">Wallet</th>
                      <th className="pb-2">Token</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">TX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveRound.bets
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((bet: Bet) => (
                      <tr key={bet.id} className="border-b border-white/5">
                        <td className="py-2 text-neon-cyan font-mono">
                          {shortenAddress(bet.wallet)}
                        </td>
                        <td className="py-2 text-neon-pink font-bold">
                          {bet.token}
                        </td>
                        <td className="py-2 font-mono">
                          {formatSOL(bet.amount)} SOL
                        </td>
                        <td className="py-2 text-white/60">
                          {formatTimestamp(bet.timestamp)}
                        </td>
                        <td className="py-2">
                          <a
                            href={`https://solscan.io/tx/${bet.txSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neon-purple hover:text-neon-cyan"
                          >
                            {bet.txSignature.slice(0, 8)}...
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
