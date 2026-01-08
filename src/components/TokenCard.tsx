"use client";

import { RoundToken } from "@/lib/coingecko";
import { formatPrice, formatPercentage } from "@/lib/utils";
import Image from "next/image";

interface TokenCardProps {
  token: RoundToken;
  price: number;
  change24h: number;
  betCount: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function TokenCard({
  token,
  price,
  change24h,
  betCount,
  isSelected,
  onSelect,
  disabled = false,
}: TokenCardProps) {
  const isPositive = change24h >= 0;

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative w-full p-4 rounded-xl transition-all duration-300
        glass-card-hover cursor-pointer
        ${isSelected ? "token-card-selected border-neon-cyan" : "border-white/10"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"}
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-cyan rounded-full flex items-center justify-center text-void font-bold text-sm animate-pulse">
          ✓
        </div>
      )}

      {/* Token Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10">
          <Image
            src={token.image}
            alt={token.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="text-left">
          <h3 className="font-orbitron font-bold text-lg text-white">
            {token.symbol}
          </h3>
          <p className="text-xs text-white/60">{token.name}</p>
        </div>
      </div>

      {/* Price Info */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-sm">Price</span>
          <span className="font-mono text-white font-semibold">
            ${formatPrice(price)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-sm">24h</span>
          <span
            className={`font-mono font-semibold ${
              isPositive ? "price-up" : "price-down"
            }`}
          >
            {formatPercentage(change24h)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <span className="text-white/60 text-sm">Bets</span>
          <span className="font-mono text-neon-purple font-semibold">
            {betCount}
          </span>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `0 0 30px ${token.color}40, inset 0 0 30px ${token.color}10`,
        }}
      />
    </button>
  );
}
