"use client";

import { Skeleton } from "@heroui/react/skeleton";
import { clubClassCardVariants } from "./ClubClassCard.styles";
import type { ClubClassCardSize } from "./ClubClassCard.types";

const CHIP_SIZE: Record<ClubClassCardSize, string> = {
  sm: "h-7 w-20 rounded-full",
  md: "h-8 w-24 rounded-full",
  lg: "h-9 w-28 rounded-full",
};

const TITLE_SIZE: Record<ClubClassCardSize, string> = {
  sm: "mt-4 h-5 w-4/5 rounded-lg",
  md: "mt-5 h-7 w-4/5 rounded-lg",
  lg: "mt-6 h-8 w-4/5 rounded-lg",
};

const ACTION_SIZE: Record<ClubClassCardSize, string> = {
  sm: "size-10 min-w-10 rounded-[14px]",
  md: "size-12 min-w-12 rounded-[18px]",
  lg: "size-14 min-w-14 rounded-[20px]",
};

export type ClubClassCardSkeletonProps = {
  size?: ClubClassCardSize;
  className?: string;
};

/** Layout-faithful skeleton for {@link ClubClassCard}. */
export function ClubClassCardSkeleton({
  size = "lg",
  className,
}: ClubClassCardSkeletonProps) {
  const slots = clubClassCardVariants({ size });

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
        <div className={slots.header()}>
          <Skeleton
            aria-hidden
            className={`relative z-10 ${CHIP_SIZE[size]}`}
          />
          <Skeleton
            aria-hidden
            className="relative z-10 h-3.5 w-28 rounded-md"
          />
        </div>
        <Skeleton aria-hidden className={`relative z-10 ${TITLE_SIZE[size]}`} />
        <div className={slots.footer()}>
          <div className={slots.meta()}>
            <Skeleton
              aria-hidden
              className="relative z-10 h-4 w-28 rounded-md"
            />
            <Skeleton
              aria-hidden
              className="relative z-10 h-4 w-16 rounded-md"
            />
          </div>
          <Skeleton
            aria-hidden
            className={`relative z-10 shrink-0 ${ACTION_SIZE[size]}`}
          />
        </div>
      </div>
    </div>
  );
}
