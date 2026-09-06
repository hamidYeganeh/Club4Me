import { Card, Typography } from "@heroui/react";
import { coachCardStyles } from "@ui/coach-card/coach-card.styles";
import { SkeletonBlock, SkeletonLines, SkeletonText } from "./primitives";

export function CoachCardSkeleton({
  type = "normal",
}: {
  type?: "normal" | "compact";
}) {
  const styles = coachCardStyles({ type });
  return (
    <Card
      variant="transparent"
      className={styles.root()}
      data-skeleton-card={`coach-${type}`}
      aria-hidden
    >
      <SkeletonBlock className="absolute inset-0 size-full rounded-none opacity-45" />
      <div className={styles.content()}>
        <div className={styles.header()}>
          <span />
        </div>
        <div className={styles.footer()}>
          <Card.Title className={styles.title()}>
            <SkeletonLines lines={1} />
          </Card.Title>
          {type === "compact" ? (
            <div className={styles.meta()}>
              <Typography type="body-sm" className={styles.metaItem()}>
                <SkeletonText>تمرین حضوری</SkeletonText>
              </Typography>
            </div>
          ) : (
            <>
              <Typography type="body-sm" className={styles.supporting()}>
                <SkeletonLines lines={1} />
              </Typography>
              <div className={styles.rating()}>
                <span className={styles.stars()}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <SkeletonBlock
                      key={index}
                      className="size-3.5 rounded-sm"
                    />
                  ))}
                </span>
                <Typography type="body-sm" className={styles.ratingValue()}>
                  <SkeletonText>۴٫۵</SkeletonText>
                </Typography>
                <Typography type="body-sm" className={styles.reviews()}>
                  <SkeletonText>(۱۲)</SkeletonText>
                </Typography>
              </div>
              <div className={styles.stats()}>
                <span className={styles.stat()}>
                  <SkeletonBlock className="size-3.5 rounded-full" />
                  <Typography type="body-sm" className={styles.statLabel()}>
                    <SkeletonText>۵ سال تجربه</SkeletonText>
                  </Typography>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
