"use client";

import { useState, useEffect } from "react";
import { formatTimeRemaining } from "@/lib/utils";

interface CountdownProps {
  endTime: number;
  onEnd?: () => void;
  compact?: boolean;
}

export function Countdown({ endTime, onEnd, compact = false }: CountdownProps) {
  // Start with placeholder to avoid hydration mismatch
  const [timeRemaining, setTimeRemaining] = useState("--:--:--");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set initial time on client
    setTimeRemaining(formatTimeRemaining(endTime));

    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(endTime);
      setTimeRemaining(remaining);

      if (remaining === "00:00:00" && onEnd) {
        onEnd();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  const [hours, minutes, seconds] = timeRemaining.split(":");

  if (compact) {
    return (
      <span className="font-mono text-neon-cyan font-bold">
        {mounted ? `${hours}:${minutes}:${seconds}` : "--:--:--"}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <TimeUnit value={mounted ? hours : "--"} label="HRS" />
      <span className="text-neon-purple text-3xl font-bold animate-pulse">:</span>
      <TimeUnit value={mounted ? minutes : "--"} label="MIN" />
      <span className="text-neon-purple text-3xl font-bold animate-pulse">:</span>
      <TimeUnit value={mounted ? seconds : "--"} label="SEC" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="countdown-digit bg-void-light px-4 py-2 rounded-lg border border-neon-cyan/30">
        {value}
      </div>
      <span className="text-xs text-white/40 mt-1">{label}</span>
    </div>
  );
}
