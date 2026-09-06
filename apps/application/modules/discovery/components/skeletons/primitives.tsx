import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "discovery-skeleton-block block shrink-0 rounded-md",
        className,
      )}
    />
  );
}

/** Keep the known label's typography and wrapping, without painting its glyphs. */
export function SkeletonText({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="discovery-skeleton-text">
      {children}
    </span>
  );
}

export function SkeletonLines({ lines = 2 }: { lines?: number }) {
  return (
    <span aria-hidden className="block">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className="flex h-[1lh] items-center">
          <SkeletonBlock
            className={cn("h-[0.7em]", index ? "w-3/5" : "w-5/6")}
          />
        </span>
      ))}
    </span>
  );
}
