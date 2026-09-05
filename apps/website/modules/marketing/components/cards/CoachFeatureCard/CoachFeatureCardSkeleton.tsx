"use client";

import { Skeleton } from "@heroui/react/skeleton";
import { coachFeatureCardVariants } from "./CoachFeatureCard.styles";

export type CoachFeatureCardSkeletonProps = {
  className?: string;
};

/** Layout-faithful skeleton for {@link CoachFeatureCard}. */
export function CoachFeatureCardSkeleton({
  className,
}: CoachFeatureCardSkeletonProps) {
  const slots = coachFeatureCardVariants();

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={slots.root({
        className: ["border border-border bg-surface", className]
          .filter(Boolean)
          .join(" "),
      })}
      role="status"
    >
      <Skeleton aria-hidden className="absolute inset-0 rounded-[inherit]" />
      <div className={slots.body()}>
        <Skeleton aria-hidden className="relative z-10 h-6 w-3/5 rounded-lg" />
        <Skeleton aria-hidden className="relative z-10 h-4 w-2/5 rounded-md" />
        <Skeleton
          aria-hidden
          className="relative z-10 mt-0.5 h-4 w-24 rounded-md"
        />
        <div className={slots.meta()}>
          <Skeleton
            aria-hidden
            className="relative z-10 h-3.5 w-16 rounded-md"
          />
          <Skeleton
            aria-hidden
            className="relative z-10 h-3.5 w-16 rounded-md"
          />
        </div>
      </div>
    </div>
  );
}
