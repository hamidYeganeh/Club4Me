"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

import {
  AnimatedThemeToggler,
  type TransitionVariant,
} from "./animated-theme-toggler";
import { cn } from "./cn";

type ThemeToggleProps = {
  className?: string;
  duration?: number;
  variant?: TransitionVariant;
  fromCenter?: boolean;
};

export function ThemeToggle({
  className,
  variant = "circle",
  duration = 400,
  fromCenter = false,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onThemeChange = useCallback(
    (next: "light" | "dark") => {
      setTheme(next);
    },
    [setTheme],
  );

  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground",
          className,
        )}
      />
    );
  }

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme === "light" ? "light" : "dark"}
      onThemeChange={onThemeChange}
      variant={variant}
      duration={duration}
      fromCenter={fromCenter}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-secondary [&_.icon]:text-[16px]",
        className,
      )}
    />
  );
}
