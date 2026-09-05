"use client";

import { Skeleton } from "@heroui/react/skeleton";
import { sportCardVariants } from "./SportCard.styles";
import type { SportCardSize } from "./SportCard.types";

const ICON_SIZE: Record<SportCardSize, string> = {
  sm: "size-7",
  md: "size-10",
  lg: "size-12",
};

const TITLE_SIZE: Record<SportCardSize, string> = {
  sm: "h-6 w-[7.5rem]",
  md: "h-8 w-40",
  lg: "h-10 w-48",
};

export type SportCardSkeletonProps = {
  size?: SportCardSize;
  className?: string;
};

/** Layout-faithful skeleton for {@link SportCard}. */
export function SportCardSkeleton({
  size = "md",
  className,
}: SportCardSkeletonProps) {
  const slots = sportCardVariants({ size });

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={slots.root({
        className: ["bg-surface", className].filter(Boolean).join(" "),
      })}
      role="status"
    >
      <Skeleton aria-hidden className="absolute inset-0 rounded-[inherit]" />
      <div className={slots.body()}>
        <div className={slots.content()}>
          <span aria-hidden className={slots.icon()}>
            <Skeleton
              className={`relative z-10 ${ICON_SIZE[size]} rounded-md`}
            />
          </span>
          <Skeleton
            aria-hidden
            className="relative z-10 h-3.5 w-16 rounded-md"
          />
          <Skeleton
            aria-hidden
            className={`relative z-10 ${TITLE_SIZE[size]} rounded-lg`}
          />
        </div>
        <Skeleton aria-hidden className={`relative z-10 ${slots.action()}`} />
      </div>
    </div>
  );
}
