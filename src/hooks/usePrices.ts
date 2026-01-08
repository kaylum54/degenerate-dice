"use client";

import { useState, useEffect, useCallback } from "react";
import { RoundToken } from "@/lib/coingecko";

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

export function usePrices(refreshInterval = 10000) {
  const [prices, setPrices] = useState<TokenPrice[]>([]);
  const [tokens, setTokens] = useState<RoundToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch("/api/prices");
      if (!response.ok) throw new Error("Failed to fetch prices");

      const data = await response.json();
      setPrices(data.prices || []);
      setTokens(data.tokens || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return { prices, tokens, isLoading, error, refresh: fetchPrices };
}
