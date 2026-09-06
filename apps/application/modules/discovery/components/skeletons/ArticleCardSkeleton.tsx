import { Card, Typography } from "@heroui/react";
import { articleCardStyles } from "@ui/article-card/article-card.styles";
import { SkeletonBlock, SkeletonLines, SkeletonText } from "./primitives";

export function ArticleCardSkeleton({
  orientation,
  outlined,
  className,
}: {
  orientation: "vertical" | "horizontal";
  outlined?: boolean;
  className?: string;
}) {
  const styles = articleCardStyles({ orientation, outlined });
  return (
    <Card
      variant="transparent"
      className={styles.root({ className })}
      data-skeleton-card={`article-${orientation}`}
      aria-hidden
    >
      <div className={styles.media()}>
        <SkeletonBlock className="absolute inset-0 size-full rounded-none" />
      </div>
      <div className={styles.body()}>
        <div className={styles.author()}>
          <SkeletonBlock
            className={styles.avatar({ className: "rounded-full" })}
          />
          <Typography type="body-sm" className={styles.authorName()}>
            <SkeletonText>نویسنده مجله</SkeletonText>
          </Typography>
        </div>
        <Card.Title className={styles.title()}>
          <SkeletonLines />
        </Card.Title>
        <Card.Description className={styles.description()}>
          <SkeletonLines />
        </Card.Description>
        <Card.Footer className={styles.footer()}>
          <span />
        </Card.Footer>
      </div>
    </Card>
  );
}
