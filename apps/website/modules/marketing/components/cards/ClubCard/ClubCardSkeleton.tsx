"use client";

import { Skeleton } from "@heroui/react/skeleton";
import { clubCardVariants } from "./ClubCard.styles";
import type { ClubCardOrientation } from "./ClubCard.types";

export type ClubCardSkeletonProps = {
  orientation?: ClubCardOrientation;
  className?: string;
};

/** Layout-faithful skeleton for {@link ClubCard}. */
export function ClubCardSkeleton({
  orientation = "horizontal",
  className,
}: ClubCardSkeletonProps) {
  const slots = clubCardVariants({ orientation });
  const isVertical = orientation === "vertical";
  const isListing = orientation === "listing";

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={slots.root({
        className: ["border border-border bg-surface", className]
          .filter(Boolean)
          .join(" "),
      })}
      data-orientation={orientation}
      role="status"
    >
      <Skeleton aria-hidden className="absolute inset-0 rounded-[inherit]" />

      {!isVertical ? (
        <div className={slots.topBar()}>
          {!isListing ? (
            <Skeleton
              aria-hidden
              className="relative z-10 h-8 w-16 rounded-full"
            />
          ) : (
            <span />
          )}
          <div className={slots.actions()}>
            <Skeleton
              aria-hidden
              className="relative z-10 size-10 rounded-full"
            />
            <Skeleton
              aria-hidden
              className="relative z-10 size-10 rounded-full"
            />
          </div>
        </div>
      ) : null}

      <div className={slots.body()}>
        {isListing ? (
          <>
            <div className={slots.badges()}>
              <Skeleton
                aria-hidden
                className="relative z-10 h-8 w-24 rounded-full"
              />
              <Skeleton
                aria-hidden
                className="relative z-10 h-8 w-16 rounded-full"
              />
            </div>
            <div className={slots.titleRow()}>
              <Skeleton
                aria-hidden
                className="relative z-10 h-6 w-3/5 rounded-lg"
              />
              <Skeleton
                aria-hidden
                className="relative z-10 h-6 w-20 rounded-lg"
              />
            </div>
            <Skeleton
              aria-hidden
              className="relative z-10 h-4 w-4/5 rounded-md"
            />
            <div className="relative z-10 flex flex-wrap gap-1.5">
              <Skeleton aria-hidden className="h-7 w-16 rounded-full" />
              <Skeleton aria-hidden className="h-7 w-20 rounded-full" />
              <Skeleton aria-hidden className="h-7 w-14 rounded-full" />
            </div>
          </>
        ) : (
          <>
            <div className={slots.header()}>
              <Skeleton
                aria-hidden
                className={
                  isVertical
                    ? "relative z-10 h-8 w-4/5 rounded-lg"
                    : "relative z-10 h-7 w-3/5 rounded-lg"
                }
              />
              <Skeleton
                aria-hidden
                className="relative z-10 mt-2 h-4 w-2/5 rounded-md"
              />
              {isVertical ? (
                <div className="relative z-10 mt-3 flex gap-2">
                  <Skeleton aria-hidden className="h-7 w-16 rounded-full" />
                  <Skeleton aria-hidden className="h-7 w-20 rounded-full" />
                </div>
              ) : null}
            </div>
            <div className={isVertical ? slots.footer() : slots.ctaGroup()}>
              <Skeleton
                aria-hidden
                className={
                  isVertical
                    ? "relative z-10 h-6 w-20 rounded-md"
                    : "relative z-10 h-5 w-16 rounded-md"
                }
              />
              <Skeleton
                aria-hidden
                className={
                  isVertical
                    ? "relative z-10 h-9 w-28 rounded-lg"
                    : "relative z-10 h-10 w-28 rounded-full"
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
