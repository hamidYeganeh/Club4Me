"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { Avatar } from "@heroui/react/avatar";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Typography } from "@heroui/react/typography";
import { Bookmark } from "@modules/marketing/icons/icons/Bookmark";
import { Chat } from "@modules/marketing/icons/icons/Chat";
import { DotThreeHorizontal } from "@modules/marketing/icons/icons/DotThreeHorizontal";
import { DotThreeVertical } from "@modules/marketing/icons/icons/DotThreeVertical";
import { Eye } from "@modules/marketing/icons/icons/Eye";
import { Heart } from "@modules/marketing/icons/icons/Heart";
import { ShapeCircle } from "@modules/marketing/icons/icons/ShapeCircle";
import { MediaImage } from "../../common/MediaImage";
import { brandAwareText } from "../../kit/LineShadowText";
import { articleCardVariants } from "./ArticleCard.styles";
import type {
  ArticleCardAuthor,
  ArticleCardOrientation,
  ArticleCardProps,
  ArticleCardTag,
  ArticleCardType,
  ArticleCardVariant,
} from "./ArticleCard.types";

const MAX_TAGS = 3;
const TAG_ICON_SIZE = 14;
const MENU_ICON_SIZE = 20;

const VARIANT_LAYOUT: Record<
  ArticleCardVariant,
  { orientation: ArticleCardOrientation; type: ArticleCardType }
> = {
  stacked: { orientation: "vertical", type: "cover" },
  vertical: { orientation: "vertical", type: "cover" },
  row: { orientation: "horizontal", type: "cover" },
  horizontal: { orientation: "horizontal", type: "cover" },
  feed: { orientation: "vertical", type: "text" },
};

function resolveLayout(
  variant: ArticleCardVariant | undefined,
  orientation: ArticleCardOrientation | undefined,
  type: ArticleCardType | undefined,
): { orientation: ArticleCardOrientation; type: ArticleCardType } {
  const fromVariant = variant ? VARIANT_LAYOUT[variant] : undefined;
  const resolvedType = type ?? fromVariant?.type ?? "cover";
  if (resolvedType === "text") {
    return { orientation: "vertical", type: "text" };
  }
  return {
    orientation: orientation ?? fromVariant?.orientation ?? "vertical",
    type: resolvedType,
  };
}

function authorInitial(author: ArticleCardAuthor | undefined) {
  return typeof author?.name === "string" ? author.name.slice(0, 1) : "A";
}

function hasValue(value: ReactNode) {
  return value != null && value !== "";
}

function MetaLine({
  items,
  className,
  itemClassName,
  textClassName,
  dotClassName,
}: {
  items: ReactNode[];
  className: string;
  itemClassName: string;
  textClassName: string;
  dotClassName: string;
}) {
  const filtered = items.filter(hasValue);
  if (filtered.length === 0) return null;

  return (
    <div className={className}>
      {filtered.map((item, index) => (
        <span key={index} className={itemClassName}>
          {index > 0 ? (
            <span aria-hidden className={dotClassName}>
              •
            </span>
          ) : null}
          <span className={textClassName}>{item}</span>
        </span>
      ))}
    </div>
  );
}

function resolveTags({
  tags,
  viewsLabel,
  likesLabel,
  commentsLabel,
}: Pick<
  ArticleCardProps,
  "tags" | "viewsLabel" | "likesLabel" | "commentsLabel"
>): ArticleCardTag[] {
  if (tags != null && tags.length > 0) return tags.slice(0, MAX_TAGS);

  const fallback: ArticleCardTag[] = [];
  if (hasValue(viewsLabel)) {
    fallback.push({
      key: "views",
      label: viewsLabel,
      icon: <Eye size={TAG_ICON_SIZE} />,
    });
  }
  if (hasValue(likesLabel)) {
    fallback.push({
      key: "likes",
      label: likesLabel,
      icon: <Heart size={TAG_ICON_SIZE} />,
    });
  }
  if (hasValue(commentsLabel)) {
    fallback.push({
      key: "comments",
      label: commentsLabel,
      icon: <Chat size={TAG_ICON_SIZE} />,
    });
  }
  return fallback.slice(0, MAX_TAGS);
}

export function ArticleCard({
  orientation: orientationProp,
  type: typeProp,
  variant,
  coverSrc,
  coverAlt = "",
  category,
  title,
  excerpt,
  publishedAtLabel,
  readingTimeLabel,
  viewsLabel,
  likesLabel,
  commentsLabel,
  tags,
  author,
  saved = false,
  saveLabel,
  onSavePress,
  menuLabel = "More",
  onMenuPress,
  actionLabel,
  className,
  onPress,
  onClick,
  onKeyDown,
  ...props
}: ArticleCardProps) {
  const layout = resolveLayout(variant, orientationProp, typeProp);
  const slots = articleCardVariants(layout);
  const isCover = layout.type === "cover";
  const isVertical = layout.orientation === "vertical";
  const isPressable = onPress != null || onClick != null;
  const showCategory = hasValue(category);
  const showExcerpt = hasValue(excerpt);
  const showAuthor = author != null && hasValue(author.name);
  const footerTags = resolveTags({
    tags,
    viewsLabel,
    likesLabel,
    commentsLabel,
  });
  const showTags = footerTags.length > 0;
  const showMenu = onMenuPress != null;
  const showSave = !showMenu && onSavePress != null && Boolean(saveLabel);
  const showOverflow = showMenu || showSave;
  const overflowInOverlay = isCover && isVertical && showOverflow;
  const overflowInFooter = showOverflow && !overflowInOverlay;
  const showOverlay =
    isCover && isVertical && (showCategory || overflowInOverlay);
  const showFooter = showTags || overflowInFooter;
  const titleType = isCover && !isVertical ? "body" : "h3";

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (!isPressable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (onPress) {
        void onPress({} as never);
        return;
      }
      onClick?.(event as never);
    }
  };

  const overflowButton = showOverflow ? (
    <Button
      aria-label={showMenu ? menuLabel : saveLabel}
      aria-pressed={showSave ? saved : undefined}
      className={slots.menuButton()}
      isIconOnly
      size="lg"
      variant="ghost"
      onClick={(event) => event.stopPropagation()}
      onPress={showMenu ? onMenuPress : onSavePress}
    >
      {showMenu ? (
        overflowInOverlay ? (
          <DotThreeVertical
            className={slots.menuIcon()}
            size={MENU_ICON_SIZE}
          />
        ) : (
          <DotThreeHorizontal
            className={slots.menuIcon()}
            size={MENU_ICON_SIZE}
          />
        )
      ) : (
        <Bookmark className={slots.menuIcon()} size={18} />
      )}
    </Button>
  ) : null;

  return (
    <Card
      {...props}
      aria-label={actionLabel}
      className={slots.root({ className })}
      data-orientation={layout.orientation}
      data-pressable={isPressable || undefined}
      data-type={layout.type}
      role={isPressable ? "button" : undefined}
      tabIndex={isPressable ? 0 : props.tabIndex}
      variant="transparent"
      onClick={(event) => {
        if (onPress) {
          void onPress({} as never);
          return;
        }
        onClick?.(event);
      }}
      onKeyDown={handleKeyDown}
    >
      {isCover ? (
        <div className={slots.cover()}>
          <MediaImage
            alt={coverAlt}
            className={slots.coverImage()}
            image={coverSrc ?? ""}
            sizes={
              isVertical
                ? "(max-width: 768px) 100vw, 420px"
                : "(max-width: 768px) 40vw, 160px"
            }
          />
          {showOverlay ? (
            <div className={slots.overlay()}>
              {showCategory ? (
                <Chip className={slots.badge()} size="sm">
                  <Chip.Label>{category}</Chip.Label>
                </Chip>
              ) : (
                <span />
              )}
              {overflowInOverlay ? overflowButton : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={slots.body()}>
        {layout.type === "text" && showCategory ? (
          <Chip className={slots.bodyBadge()} size="sm">
            <Chip.Label>{category}</Chip.Label>
          </Chip>
        ) : null}

        {showAuthor ||
        hasValue(publishedAtLabel) ||
        hasValue(readingTimeLabel) ? (
          <div className={slots.author()}>
            {showAuthor ? (
              <Avatar className={slots.avatar()}>
                {author.avatarSrc ? (
                  <Avatar.Image
                    alt={author.avatarAlt ?? ""}
                    src={author.avatarSrc}
                  />
                ) : null}
                <Avatar.Fallback>{authorInitial(author)}</Avatar.Fallback>
              </Avatar>
            ) : null}
            <MetaLine
              className={slots.authorMeta()}
              dotClassName={slots.authorDot()}
              itemClassName={slots.authorItem()}
              items={[
                showAuthor ? brandAwareText(author.name) : publishedAtLabel,
                readingTimeLabel,
              ]}
              textClassName={slots.authorItemText()}
            />
          </div>
        ) : null}

        <Typography className={slots.title()} type={titleType} weight="bold">
          {title}
        </Typography>

        {showExcerpt ? (
          <Typography className={slots.excerpt()} type="body-sm">
            {excerpt}
          </Typography>
        ) : null}

        {showFooter ? (
          <div className={slots.footer()}>
            {showTags ? (
              <div className={slots.tags()}>
                {footerTags.map((tag, index) => {
                  const icon = tag.icon ?? (
                    <ShapeCircle
                      className={slots.tagIcon()}
                      size={TAG_ICON_SIZE}
                    />
                  );
                  const content = (
                    <>
                      <span aria-hidden className={slots.tagIconWrap()}>
                        {icon}
                      </span>
                      <span className={slots.tagLabel()}>{tag.label}</span>
                    </>
                  );
                  const key = tag.key ?? String(index);

                  if (tag.onPress) {
                    return (
                      <Button
                        key={key}
                        className={slots.tag()}
                        variant="ghost"
                        onClick={(event) => event.stopPropagation()}
                        onPress={tag.onPress}
                      >
                        {content}
                      </Button>
                    );
                  }

                  return (
                    <span key={key} className={slots.tag()}>
                      {content}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span />
            )}
            {overflowInFooter ? overflowButton : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
