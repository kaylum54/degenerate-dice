"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TokenCard } from "./TokenCard";
import { RoundToken } from "@/lib/coingecko";
import { TokenPrice } from "@/hooks/usePrices";
import { MIN_BET_AMOUNT, MAX_BET_AMOUNT, DEFAULT_BET_AMOUNT, formatSOL } from "@/lib/utils";

interface BettingGridProps {
  prices: TokenPrice[];
  tokens: RoundToken[];
  betCounts: Record<string, number>;
  onBetPlaced: () => void;
  roundId: string;
  roundStatus: "betting" | "live" | "settled";
}

export function BettingGrid({
  prices,
  tokens,
  betCounts,
  onBetPlaced,
  roundId,
  roundStatus,
}: BettingGridProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(DEFAULT_BET_AMOUNT);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const escrowWallet = process.env.NEXT_PUBLIC_ESCROW_WALLET;

  const handleSelectToken = (symbol: string) => {
    setSelectedToken(symbol === selectedToken ? null : symbol);
    setError(null);
    setSuccess(null);
  };

  const handleBetAmountChange = (value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount)) {
      setBetAmount(Math.min(MAX_BET_AMOUNT, Math.max(MIN_BET_AMOUNT, amount)));
    }
  };

  const placeBet = useCallback(async () => {
    if (!publicKey || !selectedToken || !escrowWallet) {
      setError("Please connect your wallet and select a token");
      return;
    }

    if (roundStatus === "settled") {
      setError("This round has ended");
      return;
    }

    if (betAmount < MIN_BET_AMOUNT || betAmount > MAX_BET_AMOUNT) {
      setError(`Bet must be between ${MIN_BET_AMOUNT} and ${MAX_BET_AMOUNT} SOL`);
      return;
    }

    setIsPlacingBet(true);
    setError(null);
    setSuccess(null);

    try {
      // Create transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(escrowWallet),
          lamports: Math.round(betAmount * LAMPORTS_PER_SOL),
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Record bet on backend
      const response = await fetch("/api/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          token: selectedToken,
          amount: betAmount,
          txSignature: signature,
          roundId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record bet");
      }

      const statusText = roundStatus === "betting" ? "next round" : "current round";
      setSuccess(`Bet ${formatSOL(betAmount)} SOL on ${selectedToken} for ${statusText}! TX: ${signature.slice(0, 8)}...`);
      setSelectedToken(null);
      onBetPlaced();
    } catch (err) {
      console.error("Bet error:", err);
      setError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setIsPlacingBet(false);
    }
  }, [publicKey, selectedToken, escrowWallet, connection, sendTransaction, onBetPlaced, roundId, roundStatus, betAmount]);

  const getPriceForToken = (symbol: string) => {
    const priceData = prices.find((p) => p.symbol === symbol);
    return priceData || { symbol, price: 0, change24h: 0 };
  };

  const isBettingDisabled = roundStatus === "settled";

  // Quick bet amount buttons
  const quickAmounts = [0.1, 0.5, 1.0, 2.5, 5.0];

  return (
    <div className="space-y-6">
      {/* Token Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tokens.map((token) => {
          const priceData = getPriceForToken(token.symbol);
          return (
            <TokenCard
              key={token.symbol}
              token={token}
              price={priceData.price}
              change24h={priceData.change24h}
              betCount={betCounts[token.symbol] || 0}
              isSelected={selectedToken === token.symbol}
              onSelect={() => handleSelectToken(token.symbol)}
              disabled={isPlacingBet || isBettingDisabled}
            />
          );
        })}
      </div>

      {/* No tokens state */}
      {tokens.length === 0 && (
        <div className="text-center py-8 text-white/40">
          No tokens available for this round
        </div>
      )}

      {/* Bet Amount Input */}
      <div className="glass-card p-4">
        <label className="block text-white/60 text-sm mb-2">Bet Amount (SOL)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={MIN_BET_AMOUNT}
            max={MAX_BET_AMOUNT}
            step={0.05}
            value={betAmount}
            onChange={(e) => handleBetAmountChange(e.target.value)}
            disabled={isPlacingBet || isBettingDisabled}
            className="flex-1 px-4 py-3 bg-void-light border border-neon-purple/30 rounded-lg text-white font-mono text-lg focus:border-neon-cyan focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Quick amount buttons */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={isPlacingBet || isBettingDisabled}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                betAmount === amount
                  ? "bg-neon-cyan text-void font-bold"
                  : "bg-void-light text-white/60 hover:bg-neon-cyan/20 hover:text-neon-cyan"
              } disabled:opacity-50`}
            >
              {amount} SOL
            </button>
          ))}
        </div>

        <p className="text-white/40 text-xs mt-2">
          Min: {MIN_BET_AMOUNT} SOL | Max: {MAX_BET_AMOUNT} SOL
        </p>
      </div>

      {/* Bet Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={placeBet}
          disabled={!publicKey || !selectedToken || isPlacingBet || isBettingDisabled}
          className="btn-neon w-full max-w-md py-4 text-lg"
        >
          {isPlacingBet ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : isBettingDisabled ? (
            "Round Ended"
          ) : !publicKey ? (
            "Connect Wallet to Bet"
          ) : !selectedToken ? (
            "Select a Token"
          ) : (
            `Place Bet (${formatSOL(betAmount)} SOL)`
          )}
        </button>

        {/* Status Messages */}
        {error && (
          <div className="w-full max-w-md p-3 rounded-lg bg-neon-pink/20 border border-neon-pink text-neon-pink text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="w-full max-w-md p-3 rounded-lg bg-neon-cyan/20 border border-neon-cyan text-neon-cyan text-sm text-center">
            {success}
          </div>
        )}

        {/* Bet Info */}
        <p className="text-white/40 text-xs text-center max-w-md">
          {roundStatus === "betting"
            ? "You're betting on the NEXT round. Prices will be snapshotted when round goes live."
            : "Pick the memecoin you think will pump hardest. Winners split 90% of the total pool."
          }
        </p>
      </div>
    </div>
  );
}
