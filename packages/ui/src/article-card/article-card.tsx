"use client";

import { Avatar, Button, Card, Chip, Typography } from "@heroui/react";
import { Icon } from "@repo/theme/icon";

import { articleCardStyles } from "./article-card.styles";
import type { ArticleCardProps } from "./article-card.types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function ArticleCard({
  title,
  description,
  coverImageUrl,
  coverImageAlt,
  badge,
  authorName,
  authorAvatarUrl,
  readTime,
  tags = [],
  tagsLabel,
  orientation = "vertical",
  outlined = false,
  href,
  menuAriaLabel,
  onMenuPress,
  className,
}: ArticleCardProps) {
  const styles = articleCardStyles({ orientation, outlined });
  const isVertical = orientation === "vertical";
  const showOverlayBadge = isVertical && Boolean(badge);
  const showMenu = Boolean(onMenuPress);
  const menuIcon = isVertical ? "dot-three-vertical" : "dot-three-horizontal";

  const menuButton = showMenu ? (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={menuAriaLabel ?? "More"}
      className={styles.menu()}
      onPress={onMenuPress}
    >
      <Icon name={menuIcon} size={18} />
    </Button>
  ) : null;

  return (
    <Card variant="transparent" className={styles.root({ className })}>
      {href ? (
        <a href={href} className={styles.link()} aria-label={title} />
      ) : null}

      <div className={styles.media()}>
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={coverImageAlt ?? title}
            className={styles.image()}
          />
        ) : null}

        {showOverlayBadge ? (
          <Chip size="sm" className={styles.badge()}>
            <Chip.Label>{badge}</Chip.Label>
          </Chip>
        ) : null}

        {isVertical ? menuButton : null}
      </div>

      <div className={styles.body()}>
        <div className={styles.author()}>
          <Avatar size="sm" className={styles.avatar()}>
            {authorAvatarUrl ? (
              <Avatar.Image alt={authorName} src={authorAvatarUrl} />
            ) : null}
            <Avatar.Fallback>{getInitials(authorName)}</Avatar.Fallback>
          </Avatar>
          <Typography type="body-sm" truncate className={styles.authorName()}>
            {authorName}
          </Typography>
          {readTime ? (
            <>
              <Typography
                type="body-sm"
                color="muted"
                className={styles.separator()}
              >
                ·
              </Typography>
              <Typography
                type="body-sm"
                color="muted"
                className={styles.readTime()}
              >
                {readTime}
              </Typography>
            </>
          ) : null}
        </div>

        <Card.Title className={styles.title()}>{title}</Card.Title>

        {description ? (
          <Card.Description className={styles.description()}>
            {description}
          </Card.Description>
        ) : null}

        {tags.length > 0 || (!isVertical && menuButton) ? (
          <Card.Footer className={styles.footer()}>
            {tags.length > 0 ? (
              <ul className={styles.tags()} aria-label={tagsLabel}>
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <Chip
                      size="sm"
                      variant="tertiary"
                      className={styles.tag()}
                      data-kind={tag.kind}
                    >
                      <span aria-hidden className={styles.tagDot()} />
                      <Chip.Label>{tag.label}</Chip.Label>
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <span />
            )}
            {isVertical ? null : menuButton}
          </Card.Footer>
        ) : null}
      </div>
    </Card>
  );
}
