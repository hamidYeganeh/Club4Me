"use client";

import { Skeleton } from "@heroui/react/skeleton";
import { articleCardVariants } from "./ArticleCard.styles";
import type {
  ArticleCardOrientation,
  ArticleCardType,
} from "./ArticleCard.types";

export type ArticleCardSkeletonProps = {
  className?: string;
  orientation?: ArticleCardOrientation;
  type?: ArticleCardType;
};

/** Layout-faithful skeleton for {@link ArticleCard}. */
export function ArticleCardSkeleton({
  className,
  orientation = "vertical",
  type = "cover",
}: ArticleCardSkeletonProps) {
  const slots = articleCardVariants({ orientation, type });
  const isCover = type === "cover";
  const isVertical = orientation === "vertical";

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={slots.root({ className })}
      data-orientation={orientation}
      data-type={type}
      role="status"
    >
      {isCover ? (
        <div className={slots.cover()}>
          <Skeleton aria-hidden className="absolute inset-0 size-full" />
          {isVertical ? (
            <div className={slots.overlay()}>
              <Skeleton aria-hidden className="h-7 w-20 rounded-full" />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={slots.body()}>
        <div className={slots.author()}>
          <Skeleton aria-hidden className="size-7 shrink-0 rounded-full" />
          <Skeleton aria-hidden className="h-3.5 w-28 rounded-md" />
        </div>
        <Skeleton aria-hidden className="h-6 w-4/5 rounded-lg" />
        <Skeleton aria-hidden className="h-4 w-full rounded-md" />
        <Skeleton aria-hidden className="h-4 w-3/5 rounded-md" />
        <div className={slots.footer()}>
          <div className={slots.tags()}>
            <Skeleton aria-hidden className="h-4 w-14 rounded-md" />
            <Skeleton aria-hidden className="h-4 w-12 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
