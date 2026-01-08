"use client";

import { formatSOL, calculatePrizePool, calculateFee, MIN_BET_AMOUNT, MAX_BET_AMOUNT } from "@/lib/utils";

interface PoolInfoProps {
  totalPool: number;
  totalBets: number;
  roundId?: string;
  status?: "preview" | "betting" | "live" | "settled";
}

export function PoolInfo({ totalPool, totalBets, roundId, status }: PoolInfoProps) {
  const prizePool = calculatePrizePool(totalPool);
  const fee = calculateFee(totalPool);

  const getStatusBadge = () => {
    switch (status) {
      case "preview":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
            Next Round
          </span>
        );
      case "betting":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
            Betting Open
          </span>
        );
      case "live":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-neon-pink/20 text-neon-pink px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-neon-pink rounded-full animate-pulse" />
            Live
          </span>
        );
      case "settled":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-white/10 text-white/60 px-2 py-1 rounded-full">
            Settled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-orbitron text-sm text-white/60 uppercase tracking-wider">
          Pool Info
        </h3>
        {getStatusBadge()}
      </div>

      <div className="space-y-4">
        {/* Total Pool */}
        <div className="text-center">
          <div className="text-4xl font-orbitron font-bold text-neon-cyan neon-text mb-1">
            {formatSOL(totalPool)} SOL
          </div>
          <div className="text-white/40 text-sm">Total Pool</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <StatItem label="Prize Pool (90%)" value={`${formatSOL(prizePool)} SOL`} color="pink" />
          <StatItem label="Platform Fee (10%)" value={`${formatSOL(fee)} SOL`} color="purple" />
          <StatItem label="Total Bets" value={totalBets.toString()} color="cyan" />
          <StatItem label="Bet Range" value={`${MIN_BET_AMOUNT}-${MAX_BET_AMOUNT} SOL`} color="orange" />
        </div>

        {/* Fee Clarification */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">
            Fee is taken from total pool, not individual bets
          </p>
        </div>

        {/* Round ID */}
        {roundId && (
          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-white/40">
              Round: <span className="font-mono text-neon-purple">{roundId.slice(-8)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "pink" | "purple" | "cyan" | "orange";
}) {
  const colorClasses = {
    pink: "text-neon-pink",
    purple: "text-neon-purple",
    cyan: "text-neon-cyan",
    orange: "text-neon-orange",
  };

  return (
    <div className="text-center">
      <div className={`font-mono font-semibold ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}
