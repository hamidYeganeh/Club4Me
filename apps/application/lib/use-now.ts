"use client";

import { useEffect, useState } from "react";

export function useNow(refreshMilliseconds = 60_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = window.setTimeout(update, 0);
    const interval = window.setInterval(update, refreshMilliseconds);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [refreshMilliseconds]);
  return now;
}
