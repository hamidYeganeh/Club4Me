import { Card } from "@heroui/react";
import { clubCardStyles } from "@ui/club-card/club-card.styles";
import type { ClubCardVariant } from "@ui/club-card";
import { SkeletonBlock, SkeletonLines } from "./primitives";

export function ClubCardSkeleton({
  variant,
  className,
}: {
  variant: ClubCardVariant;
  className?: string;
}) {
  const styles = clubCardStyles({ variant });
  return (
    <Card
      variant="transparent"
      className={styles.root({ className })}
      data-skeleton-card={`club-${variant}`}
      aria-hidden
    >
      <SkeletonBlock className="absolute inset-0 size-full rounded-none opacity-45" />
      <div className={styles.content()}>
        <div className={styles.top()}>
          <span className={styles.rating()}>
            <SkeletonBlock className="size-4 rounded-full" />
            <SkeletonBlock className="h-3 w-7" />
            <SkeletonBlock className="h-3 w-6" />
          </span>
        </div>
        <div className={styles.body()}>
          <div className={styles.bottom()}>
            <div className={styles.identity()}>
              <Card.Title className={styles.title()}>
                <SkeletonLines lines={1} />
              </Card.Title>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
