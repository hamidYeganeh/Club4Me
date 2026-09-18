import type { CSSProperties } from "react";
import { Card, Typography } from "@heroui/react";
import { clubCardStyles } from "@ui/club-card/club-card.styles";
import type { ClubCardVariant } from "@ui/club-card";
import { SkeletonBlock, SkeletonLines, SkeletonText } from "./primitives";

export function ClubCardSkeleton({
  variant,
  className,
}: {
  variant: ClubCardVariant;
  className?: string;
}) {
  const isOverlay = variant === "overlay";
  const styles = clubCardStyles({ variant });
  return (
    <Card
      variant="transparent"
      className={styles.root({ className })}
      data-skeleton-card={`club-${variant}`}
      aria-hidden
    >
      <SkeletonBlock className="absolute inset-0 size-full rounded-none opacity-45" />
      {isOverlay ? (
        <div aria-hidden className={styles.shadeEdge()}>
          <div className={styles.shadeGradient()} />
          {([2, 4, 8, 16] as const).map((blur, index) => (
            <div
              key={blur}
              className={styles.shadeBlur()}
              style={
                {
                  "--blur": `${blur}px`,
                  "--reach": `${100 - index * 20}%`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
      <div className={styles.content()}>
        <div className={styles.top()}>
          {isOverlay ? (
            <span className={styles.priceBadge()}>
              <SkeletonBlock className="h-3 w-16" />
            </span>
          ) : (
            <span className={styles.rating()}>
              <SkeletonBlock className="size-4 rounded-full" />
              <SkeletonBlock className="h-3 w-7" />
              <SkeletonBlock className="h-3 w-6" />
            </span>
          )}
        </div>
        <div className={styles.body()}>
          <div className={styles.bottom()}>
            <div className={styles.identity()}>
              {isOverlay ? (
                <div className={styles.titleRow()}>
                  <Card.Title className={styles.title()}>
                    <SkeletonLines lines={1} />
                  </Card.Title>
                  <span className={styles.titleRating()}>
                    <SkeletonBlock className="size-3.5 rounded-full" />
                    <SkeletonBlock className="h-3 w-10" />
                  </span>
                </div>
              ) : (
                <Card.Title className={styles.title()}>
                  <SkeletonLines lines={1} />
                </Card.Title>
              )}
              <div className={styles.details()}>
                <SkeletonBlock className="size-4 shrink-0 rounded-md" />
                <Typography type="body-sm" className={styles.detailText()}>
                  <SkeletonText>آدرس مجموعه ورزشی</SkeletonText>
                </Typography>
              </div>
              {isOverlay ? (
                <div className={styles.sports()}>
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-3 w-14" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
