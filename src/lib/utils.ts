// Utility functions

export const MIN_BET_AMOUNT = 0.1; // SOL
export const MAX_BET_AMOUNT = 5; // SOL
export const DEFAULT_BET_AMOUNT = 0.5; // SOL
export const FEE_PERCENTAGE = 0.10; // 10%
export const ROUND_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Validate bet amount
export function isValidBetAmount(amount: number): boolean {
  return amount >= MIN_BET_AMOUNT && amount <= MAX_BET_AMOUNT;
}

// Format wallet address for display
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Format SOL amount
export function formatSOL(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

// Format price with appropriate decimals
export function formatPrice(price: number): string {
  if (price < 0.0001) {
    return price.toExponential(2);
  }
  if (price < 0.01) {
    return price.toFixed(6);
  }
  if (price < 1) {
    return price.toFixed(4);
  }
  return price.toFixed(2);
}

// Format percentage change
export function formatPercentage(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

// Format time remaining
export function formatTimeRemaining(endTime: number): string {
  const now = Date.now();
  const remaining = endTime - now;

  if (remaining <= 0) return "00:00:00";

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// Calculate prize pool after fee
export function calculatePrizePool(totalPool: number): number {
  return totalPool * (1 - FEE_PERCENTAGE);
}

// Calculate fee amount
export function calculateFee(totalPool: number): number {
  return totalPool * FEE_PERCENTAGE;
}

// Lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

// SOL to Lamports
export function solToLamports(sol: number): number {
  return Math.round(sol * 1_000_000_000);
}
