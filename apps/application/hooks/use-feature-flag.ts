"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gym4me:feature-flags";

export function useFeatureFlag(name: string, fallback = false) {
  const [enabled, setEnabled] = useState(fallback);

  useEffect(() => {
    const read = () => {
      try {
        const flags = JSON.parse(
          localStorage.getItem(STORAGE_KEY) ?? "{}",
        ) as Record<string, boolean>;
        setEnabled(flags[name] ?? fallback);
      } catch {
        setEnabled(fallback);
      }
    };
    read();
    window.addEventListener("gym4me:feature-flags-changed", read);
    return () =>
      window.removeEventListener("gym4me:feature-flags-changed", read);
  }, [fallback, name]);

  return enabled;
}
