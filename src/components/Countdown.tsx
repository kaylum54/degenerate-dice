"use client";

import { useState, useEffect, useRef } from "react";
import { formatTimeRemaining } from "@/lib/utils";
import { playSound } from "@/hooks/useSounds";

interface CountdownProps {
  endTime: number;
  onEnd?: () => void;
  compact?: boolean;
}

export function Countdown({ endTime, onEnd, compact = false }: CountdownProps) {
  // Start with placeholder to avoid hydration mismatch
  const [timeRemaining, setTimeRemaining] = useState("--:--:--");
  const [mounted, setMounted] = useState(false);
  const lastTickRef = useRef<number>(-1);

  useEffect(() => {
    setMounted(true);
    // Set initial time on client
    setTimeRemaining(formatTimeRemaining(endTime));

    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(endTime);
      setTimeRemaining(remaining);

      // Calculate seconds remaining for sound effects
      const msRemaining = endTime - Date.now();
      const secondsRemaining = Math.floor(msRemaining / 1000);

      // Play tick sound for last 10 seconds (only once per second)
      if (secondsRemaining <= 10 && secondsRemaining > 0 && secondsRemaining !== lastTickRef.current) {
        lastTickRef.current = secondsRemaining;
        if (secondsRemaining <= 3) {
          playSound("countdown"); // More urgent sound for last 3 seconds
        } else {
          playSound("tick");
        }
      }

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
      <span className="font-mono text-gold font-bold">
        {mounted ? `${hours}:${minutes}:${seconds}` : "--:--:--"}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <TimeUnit value={mounted ? hours : "--"} label="HRS" />
      <span className="text-teal text-xl font-bold animate-pulse">:</span>
      <TimeUnit value={mounted ? minutes : "--"} label="MIN" />
      <span className="text-teal text-xl font-bold animate-pulse">:</span>
      <TimeUnit value={mounted ? seconds : "--"} label="SEC" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="countdown-digit bg-navy-light px-2 py-1 rounded-lg border border-teal/30 text-lg">
        {value}
      </div>
      <span className="text-[10px] text-slate mt-0.5">{label}</span>
    </div>
  );
}
