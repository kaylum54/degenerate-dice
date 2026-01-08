"use client";

import { useEffect, useState } from "react";
import { LeaderboardEntry } from "@/lib/storage";
import { shortenAddress, formatSOL } from "@/lib/utils";

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        if (response.ok) {
          const data = await response.json();
          setEntries(data.leaderboard || []);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="leaderboard" className="glass-card p-6">
      <h2 className="font-heading text-xl font-bold gradient-text mb-6 flex items-center gap-3">
        <span>🏆</span>
        Top Performers
      </h2>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-slate">
          <p>No winners yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 text-xs text-slate uppercase tracking-wider pb-2 border-b border-white/10">
            <span>Rank</span>
            <span>Wallet</span>
            <span className="text-right">Won</span>
            <span className="text-right">Wins</span>
          </div>

          {/* Entries */}
          {entries.map((entry, index) => (
            <LeaderboardRow
              key={entry.wallet}
              entry={entry}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return "text-yellow-400 font-bold";
      case 2:
        return "text-gray-300 font-bold";
      case 3:
        return "text-orange-400 font-bold";
      default:
        return "text-slate-light";
    }
  };

  const getRankEmoji = () => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return rank.toString();
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors rounded">
      <span className={`${getRankStyle()} text-lg`}>{getRankEmoji()}</span>
      <span className="text-gold font-mono">
        {shortenAddress(entry.wallet, 6)}
      </span>
      <span className="text-right font-mono text-teal font-semibold">
        {formatSOL(entry.totalWinnings)} SOL
      </span>
      <span className="text-right text-slate-light">{entry.winCount}</span>
    </div>
  );
}

// Compact leaderboard for sidebar
export function LeaderboardCompact() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard?limit=5");
        if (response.ok) {
          const data = await response.json();
          setEntries(data.leaderboard || []);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="glass-card p-4">
      <h3 className="font-heading text-sm text-slate-light mb-3 uppercase tracking-wider flex items-center gap-2">
        🏆 Top 5
      </h3>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-slate text-sm">No winners yet</p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.wallet}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate w-4">{index + 1}.</span>
                <span className="text-gold">
                  {shortenAddress(entry.wallet, 4)}
                </span>
              </div>
              <span className="text-teal font-mono">
                {formatSOL(entry.totalWinnings)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
