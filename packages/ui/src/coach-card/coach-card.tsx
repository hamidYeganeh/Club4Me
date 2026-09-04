"use client";

import { Avatar, Button, Card, Chip, Typography } from "@heroui/react";
import { Icon } from "@repo/theme/icon";

import { coachCardStyles } from "./coach-card.styles";
import type { CoachCardProps, CoachCardStat } from "./coach-card.types";

const STAR_COUNT = 5;

const BLUR_LAYERS = [
  { blur: 1, stop: 72 },
  { blur: 2, stop: 58 },
  { blur: 4, stop: 46 },
  { blur: 8, stop: 34 },
  { blur: 16, stop: 22 },
  { blur: 28, stop: 12 },
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function starKind(index: number, rating: number): "full" | "half" | "empty" {
  if (rating >= index + 1) {
    return "full";
  }
  if (rating >= index + 0.5) {
    return "half";
  }
  return "empty";
}

function CoachCardStars({
  rating,
  className,
  starClassName,
}: {
  rating: number;
  className: string;
  starClassName: string;
}) {
  return (
    <span className={className} aria-hidden>
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const kind = starKind(index, rating);
        return (
          <Icon
            key={index}
            name={kind === "half" ? "star-half" : "star-full"}
            size={14}
            className={[
              starClassName,
              kind === "empty"
                ? "[--icon-secondary-opacity:0.18]"
                : "[--icon-secondary-opacity:1]",
            ].join(" ")}
          />
        );
      })}
    </span>
  );
}

function CoachCardStats({
  stats,
  styles,
}: {
  stats: CoachCardStat[];
  styles: ReturnType<typeof coachCardStyles>;
}) {
  const visible = stats.filter((stat) => stat.label.trim().length > 0);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className={styles.stats()}>
      {visible.map((stat, index) => (
        <span key={stat.id ?? `${stat.label}-${index}`} className="contents">
          {index > 0 ? <span aria-hidden className={styles.statsDot()} /> : null}
          <span className={styles.stat()}>
            {stat.icon ? (
              <Icon name={stat.icon} size={14} className={styles.statIcon()} />
            ) : (
              <span aria-hidden className={styles.statMark()} />
            )}
            <Typography type="body-sm" className={styles.statLabel()}>
              {stat.label}
            </Typography>
          </span>
        </span>
      ))}
    </div>
  );
}

export function CoachCard({
  type = "normal",
  title,
  imageUrl,
  imageAlt,
  badge,
  href,
  actionAriaLabel,
  onActionPress,
  supportingText,
  rating,
  reviewsCount,
  stats = [],
  meta = [],
  authorName,
  authorAvatarUrl,
  className,
}: CoachCardProps) {
  const styles = coachCardStyles({ type });
  const isCompact = type === "compact";
  const visibleMeta = meta.filter((item) => item.trim().length > 0);
  const clampedRating =
    typeof rating === "number"
      ? Math.min(STAR_COUNT, Math.max(0, rating))
      : undefined;

  return (
    <Card variant="transparent" className={styles.root({ className })}>
      <img src={imageUrl} alt={imageAlt ?? title} className={styles.image()} />

      <div aria-hidden className={styles.blur()}>
        {BLUR_LAYERS.map((layer) => (
          <div
            key={layer.blur}
            className={styles.blurLayer()}
            style={{
              backdropFilter: `blur(${layer.blur}px)`,
              WebkitBackdropFilter: `blur(${layer.blur}px)`,
              maskImage: `linear-gradient(to top, black 0%, transparent ${layer.stop}%)`,
              WebkitMaskImage: `linear-gradient(to top, black 0%, transparent ${layer.stop}%)`,
            }}
          />
        ))}
        <div className={styles.fade()} />
      </div>

      {href ? (
        <a href={href} className={styles.link()} aria-label={title} />
      ) : null}

      <div className={styles.content()}>
        <div className={styles.header()}>
          {badge ? (
            <Chip size="sm" className={styles.badge()}>
              <Chip.Label>{badge}</Chip.Label>
            </Chip>
          ) : (
            <span />
          )}

          {onActionPress ? (
            <Button
              isIconOnly
              size="sm"
              variant="outline"
              aria-label={actionAriaLabel ?? "Select"}
              className={styles.action()}
              onPress={onActionPress}
            >
              <span aria-hidden className={styles.actionMark()} />
            </Button>
          ) : null}
        </div>

        <div className={styles.footer()}>
          <Card.Title className={styles.title()}>{title}</Card.Title>

          {isCompact ? (
            <>
              {visibleMeta.length > 0 ? (
                <div className={styles.meta()}>
                  {visibleMeta.map((item, index) => (
                    <span key={`${item}-${index}`} className="contents">
                      {index > 0 ? (
                        <span aria-hidden className={styles.metaDot()} />
                      ) : null}
                      <Typography type="body-sm" className={styles.metaItem()}>
                        {item}
                      </Typography>
                    </span>
                  ))}
                </div>
              ) : null}

              {authorName ? (
                <div className={styles.author()}>
                  <Avatar size="sm" className={styles.avatar()}>
                    {authorAvatarUrl ? (
                      <Avatar.Image alt={authorName} src={authorAvatarUrl} />
                    ) : null}
                    <Avatar.Fallback>{getInitials(authorName)}</Avatar.Fallback>
                  </Avatar>
                  <Typography type="body-sm" className={styles.authorName()}>
                    {authorName}
                  </Typography>
                </div>
              ) : null}
            </>
          ) : (
            <>
              {supportingText ? (
                <Typography type="body-sm" className={styles.supporting()}>
                  {supportingText}
                </Typography>
              ) : null}

              {clampedRating != null ? (
                <div
                  className={styles.rating()}
                  aria-label={`${formatRating(clampedRating)} from ${STAR_COUNT}${
                    reviewsCount != null ? `, ${reviewsCount} reviews` : ""
                  }`}
                >
                  <CoachCardStars
                    rating={clampedRating}
                    className={styles.stars()}
                    starClassName={styles.star()}
                  />
                  <Typography type="body-sm" className={styles.ratingValue()}>
                    {formatRating(clampedRating)}
                  </Typography>
                  {reviewsCount != null ? (
                    <Typography type="body-sm" className={styles.reviews()}>
                    {`(${reviewsCount})`}
                    </Typography>
                  ) : null}
                </div>
              ) : null}

              <CoachCardStats stats={stats} styles={styles} />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
