"use client";

import { Skeleton } from "@heroui/react/skeleton";
import { quickActionCardVariants } from "./QuickActionCard.styles";

export type QuickActionCardSkeletonProps = {
  layout?: "tile" | "row";
  className?: string;
};

/** Layout-faithful skeleton for {@link QuickActionCard}. */
export function QuickActionCardSkeleton({
  layout = "tile",
  className,
}: QuickActionCardSkeletonProps) {
  const slots = quickActionCardVariants({ layout });
  const isRow = layout === "row";

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={slots.root({ className })}
      role="status"
    >
      <Skeleton aria-hidden className={slots.tile()} />
      <Skeleton
        aria-hidden
        className={
          isRow ? "h-4 w-20 rounded-md" : "mx-auto h-3 w-12 rounded-md"
        }
      />
    </div>
  );
}
