"use client";

import { useState, useEffect } from "react";

interface TimeUntilProps {
  endTime: number;
  format?: "minutes" | "full";
}

// Client-side only time display to avoid hydration mismatches
export function TimeUntil({ endTime, format = "minutes" }: TimeUntilProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(Math.max(0, endTime - Date.now()));

    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, endTime - Date.now()));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!mounted) {
    return <span>--</span>;
  }

  if (format === "minutes") {
    return <span>{Math.ceil(timeLeft / 60000)}min</span>;
  }

  // Full format: HH:MM:SS
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span>
      {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </span>
  );
}

interface TimeCheckProps {
  endTime: number;
  threshold: number;
  children: React.ReactNode;
}

// Client-side only conditional render based on time
export function ShowWhenTimeNear({ endTime, threshold, children }: TimeCheckProps) {
  const [mounted, setMounted] = useState(false);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsNear(endTime - Date.now() <= threshold);

    const interval = setInterval(() => {
      setIsNear(endTime - Date.now() <= threshold);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, threshold]);

  if (!mounted || !isNear) {
    return null;
  }

  return <>{children}</>;
}
