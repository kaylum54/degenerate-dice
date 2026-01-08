"use client";

import { useEffect, useState } from "react";
import { Bet } from "@/lib/storage";
import { shortenAddress, formatTimestamp } from "@/lib/utils";

interface ActivityTickerProps {
  initialBets?: Bet[];
}

export function ActivityTicker({ initialBets = [] }: ActivityTickerProps) {
  const [bets, setBets] = useState<Bet[]>(initialBets);

  // Poll for new activity
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch("/api/round");
        if (response.ok) {
          const data = await response.json();
          if (data.activity) {
            setBets(data.activity);
          }
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (bets.length === 0) {
    return (
      <div className="glass-card p-4">
        <h3 className="font-orbitron text-xs text-white/60 mb-2 uppercase tracking-wider">
          Live Activity
        </h3>
        <p className="text-white/40 text-sm">No bets yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 overflow-hidden">
      <h3 className="font-orbitron text-xs text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
        Live Activity
      </h3>
      <div className="ticker-container">
        <div className="ticker-content flex gap-8">
          {[...bets, ...bets].map((bet, index) => (
            <ActivityItem key={`${bet.id}-${index}`} bet={bet} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ bet }: { bet: Bet }) {
  return (
    <div className="flex items-center gap-2 text-sm whitespace-nowrap">
      <span className="text-neon-cyan">{shortenAddress(bet.wallet)}</span>
      <span className="text-white/40">bet on</span>
      <span className="text-neon-pink font-bold">{bet.token}</span>
      <span className="text-white/20">•</span>
      <span className="text-white/40">{formatTimestamp(bet.timestamp)}</span>
    </div>
  );
}

// Static activity list (non-scrolling)
export function ActivityList({ bets }: { bets: Bet[] }) {
  return (
    <div className="glass-card p-4">
      <h3 className="font-orbitron text-xs text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
        Recent Bets
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {bets.length === 0 ? (
          <p className="text-white/40 text-sm">No bets yet</p>
        ) : (
          bets.slice(0, 10).map((bet) => (
            <div
              key={bet.id}
              className="flex items-center justify-between text-sm py-1 border-b border-white/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-neon-cyan">
                  {shortenAddress(bet.wallet)}
                </span>
                <span className="text-white/40">→</span>
                <span className="text-neon-pink font-bold">{bet.token}</span>
              </div>
              <span className="text-white/40 text-xs">
                {formatTimestamp(bet.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
