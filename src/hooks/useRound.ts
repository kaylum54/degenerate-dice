"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Round, Bet, RoundHistoryEntry } from "@/lib/storage";

interface BettingInfo {
  status: "open" | "locked" | "none";
  target: "live" | "next" | null;
  endsIn: number | null;
  isLiveRoundBettingOpen: boolean;
  isNextRoundBettingOpen: boolean;
}

interface RoundData {
  liveRound: Round | null;
  nextRound: Round | null;
  liveBetCounts: Record<string, number>;
  nextBetCounts: Record<string, number>;
  activity: Bet[];
  lastSettledRound: RoundHistoryEntry | null;
  betting: BettingInfo;
  config: {
    roundDuration: number;
    bettingWindow: number;
    previewWindow: number;
  };
}

export function useRound(refreshInterval = 3000) {
  const [liveRound, setLiveRound] = useState<Round | null>(null);
  const [nextRound, setNextRound] = useState<Round | null>(null);
  const [liveBetCounts, setLiveBetCounts] = useState<Record<string, number>>({});
  const [nextBetCounts, setNextBetCounts] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<Bet[]>([]);
  const [lastSettledRound, setLastSettledRound] = useState<RoundHistoryEntry | null>(null);
  const [betting, setBetting] = useState<BettingInfo>({
    status: "none",
    target: null,
    endsIn: null,
    isLiveRoundBettingOpen: false,
    isNextRoundBettingOpen: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track last advance check to avoid too frequent calls
  const lastAdvanceCheck = useRef<number>(0);

  // Check and advance rounds automatically
  const checkAndAdvanceRound = useCallback(async () => {
    const now = Date.now();
    // Only check every 30 seconds to avoid hammering the API
    if (now - lastAdvanceCheck.current < 30000) {
      return;
    }
    lastAdvanceCheck.current = now;

    try {
      await fetch("/api/cron/advance-round");
    } catch (err) {
      console.error("Failed to advance round:", err);
    }
  }, []);

  const fetchRound = useCallback(async () => {
    try {
      // First, check if rounds need to be advanced
      await checkAndAdvanceRound();

      const response = await fetch("/api/round");
      if (!response.ok) throw new Error("Failed to fetch round");

      const data: RoundData = await response.json();
      setLiveRound(data.liveRound);
      setNextRound(data.nextRound);
      setLiveBetCounts(data.liveBetCounts || {});
      setNextBetCounts(data.nextBetCounts || {});
      setActivity(data.activity || []);
      setLastSettledRound(data.lastSettledRound || null);
      setBetting(data.betting || {
        status: "none",
        target: null,
        endsIn: null,
        isLiveRoundBettingOpen: false,
        isNextRoundBettingOpen: false,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch round");
    } finally {
      setIsLoading(false);
    }
  }, [checkAndAdvanceRound]);

  useEffect(() => {
    fetchRound();
    const interval = setInterval(fetchRound, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRound, refreshInterval]);

  return {
    liveRound,
    nextRound,
    liveBetCounts,
    nextBetCounts,
    activity,
    lastSettledRound,
    betting,
    isLoading,
    error,
    refresh: fetchRound,
  };
}
