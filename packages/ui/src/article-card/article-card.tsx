"use client";

import { Avatar, Button, Card, Chip, Typography } from "@heroui/react";
import { Icon, type IconName } from "@repo/theme/icon";

import { FALLBACK_IMAGE_SRC, resolveImageSrc } from "../fallback-image";
import { useFallbackImageSrc } from "../use-fallback-image-src";
import { articleCardStyles } from "./article-card.styles";
import type { ArticleCardProps, ArticleCardTag } from "./article-card.types";

function getTagIcon(tag: ArticleCardTag): IconName {
  if (tag.icon) return tag.icon;
  if (tag.kind === "type") return "hash-tag-1";
  return "folder";
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
  const { src: resolvedCoverUrl, onError: onCoverError } =
    useFallbackImageSrc(coverImageUrl);
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
        <img
          src={resolvedCoverUrl}
          alt={coverImageAlt ?? title}
          className={styles.image()}
          onError={onCoverError}
        />

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
            <Avatar.Image
              alt={authorName}
              src={resolveImageSrc(authorAvatarUrl)}
            />
            <Avatar.Fallback className="overflow-hidden p-0">
              <img
                src={FALLBACK_IMAGE_SRC}
                alt=""
                className="size-full object-cover"
              />
            </Avatar.Fallback>
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

        <Card.Description className={styles.description()}>
          {description?.trim() ? description : "\u00A0"}
        </Card.Description>

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
                    <Icon
                      name={getTagIcon(tag)}
                      size={14}
                      className={styles.tagIcon()}
                    />
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
      </div>
    </Card>
  );
}
