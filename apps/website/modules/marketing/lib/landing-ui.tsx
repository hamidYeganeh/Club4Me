"use client";

import { cn } from "./marketing-cn";

export function LandingEyebrow({
  children,
  tone = "dark",
  className,
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-bold tracking-[0.22em] uppercase",
        tone === "dark" ? "text-muted" : "text-(--on-brand-muted)",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "dark" ? "bg-accent" : "bg-(--brand-light)",
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}
