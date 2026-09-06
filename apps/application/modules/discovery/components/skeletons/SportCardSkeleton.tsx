import { Card, Typography } from "@heroui/react";
import { sportCardStyles } from "@ui/sport-card";
import { SkeletonBlock, SkeletonText } from "./primitives";

export function SportCardSkeleton() {
  const styles = sportCardStyles({ hasBackground: true });
  return (
    <div
      className="w-[12.5rem] shrink-0 snap-start rounded-[20px]"
      data-skeleton-card="sport"
      aria-hidden
    >
      <Card variant="transparent" className={styles.root()}>
        <SkeletonBlock className="absolute inset-0 size-full rounded-none opacity-45" />
        <div className={styles.content()}>
          <SkeletonBlock className="size-8 rounded-lg" />
          <div>
            <div className={styles.metric()}>
              <Typography type="h3" className={styles.value()}>
                <SkeletonText>رشته ورزشی</SkeletonText>
              </Typography>
            </div>
            <Typography type="body-sm" className={styles.supporting()}>
              <SkeletonText>تمرین و آمادگی بدنی</SkeletonText>
            </Typography>
          </div>
        </div>
      </Card>
    </div>
  );
}
