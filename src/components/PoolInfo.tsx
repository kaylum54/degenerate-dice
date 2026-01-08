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
          <span className="inline-flex items-center gap-1 text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            Next Round
          </span>
        );
      case "betting":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            Staking Open
          </span>
        );
      case "live":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-teal/20 text-teal px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
            Live
          </span>
        );
      case "settled":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-white/10 text-slate-light px-2 py-1 rounded-full">
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
        <h3 className="font-heading text-sm text-slate-light uppercase tracking-wider">
          Pool Info
        </h3>
        {getStatusBadge()}
      </div>

      <div className="space-y-4">
        {/* Total Pool */}
        <div className="text-center">
          <div className="text-4xl font-heading font-bold text-gold neon-text mb-1">
            {formatSOL(totalPool)} SOL
          </div>
          <div className="text-slate text-sm">Total Pool</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <StatItem label="Prize Pool (90%)" value={`${formatSOL(prizePool)} SOL`} color="pink" />
          <StatItem label="Platform Fee (10%)" value={`${formatSOL(fee)} SOL`} color="purple" />
          <StatItem label="Total Stakes" value={totalBets.toString()} color="cyan" />
          <StatItem label="Stake Range" value={`${MIN_BET_AMOUNT}-${MAX_BET_AMOUNT} SOL`} color="orange" />
        </div>

        {/* Fee Clarification */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-slate text-center">
            Fee is taken from total pool, not individual stakes
          </p>
        </div>

        {/* Round ID */}
        {roundId && (
          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-slate">
              Round: <span className="font-mono text-gold">{roundId.slice(-8)}</span>
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
    pink: "text-teal",
    purple: "text-gold",
    cyan: "text-gold",
    orange: "text-gold",
  };

  return (
    <div className="text-center">
      <div className={`font-mono font-semibold ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-xs text-slate">{label}</div>
    </div>
  );
}
