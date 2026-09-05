"use client";

import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Typography } from "@heroui/react/typography";
import { ArrowUpRight } from "@modules/marketing/icons/icons/ArrowUpRight";
import { BarbellHorizontal } from "@modules/marketing/icons/icons/BarbellHorizontal";
import { Clock } from "@modules/marketing/icons/icons/Clock";
import { User } from "@modules/marketing/icons/icons/User";
import type { CSSProperties } from "react";
import { MediaImage } from "../../common/MediaImage";
import { brandAwareText } from "../../kit/LineShadowText";
import { clubClassCardVariants } from "./ClubClassCard.styles";
import type {
  ClubClassCardProps,
  ClubClassCardSize,
} from "./ClubClassCard.types";

/** Intentional dark card surface — uses theme eclipse so light/dark stay consistent. */
const DEFAULT_COLOR = "var(--eclipse)";
const DEFAULT_FOREGROUND = "var(--stats-foreground)";
const DEFAULT_ACCENT = "color-mix(in oklch, var(--eclipse) 88%, var(--snow))";
const DEFAULT_OVERLAY_OPACITY = 0.72;

const TITLE_TYPE: Record<ClubClassCardSize, "h4" | "h3" | "h2"> = {
  sm: "h4",
  md: "h3",
  lg: "h2",
};

const META_TYPE: Record<ClubClassCardSize, "body-xs" | "body-sm" | "body"> = {
  sm: "body-xs",
  md: "body-sm",
  lg: "body",
};

const CHIP_ICON_SIZE: Record<ClubClassCardSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

const META_ICON_SIZE: Record<ClubClassCardSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

const ARROW_SIZE: Record<ClubClassCardSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function ClubClassCard({
  category,
  categoryIcon,
  date,
  title,
  author,
  duration,
  backgroundImage,
  backgroundImageAlt = "",
  size = "lg",
  onAction,
  actionLabel = "Open",
  color = DEFAULT_COLOR,
  foregroundColor = DEFAULT_FOREGROUND,
  accentColor = DEFAULT_ACCENT,
  actionForegroundColor,
  overlayOpacity = DEFAULT_OVERLAY_OPACITY,
  backgroundImageClassName,
  categoryClassName,
  actionClassName,
  className,
  style,
  ...props
}: ClubClassCardProps) {
  const slots = clubClassCardVariants({ size });
  const hasBackgroundImage = backgroundImage != null && backgroundImage !== "";
  const arrowColor = actionForegroundColor ?? foregroundColor;
  const chipIconSize = CHIP_ICON_SIZE[size];
  const metaIconSize = META_ICON_SIZE[size];
  const arrowSize = ARROW_SIZE[size];

  const rootStyle: CSSProperties = {
    backgroundColor: color,
    color: foregroundColor,
    ...style,
  };

  return (
    <Card
      className={slots.root({ className })}
      style={rootStyle}
      variant="transparent"
      {...props}
    >
      {hasBackgroundImage && backgroundImage != null ? (
        <MediaImage
          alt={backgroundImageAlt}
          aria-hidden={backgroundImageAlt ? undefined : true}
          className={slots.backgroundImage({
            className: backgroundImageClassName,
          })}
          image={backgroundImage}
          sizes="(max-width: 768px) 50vw, 280px"
        />
      ) : null}

      {hasBackgroundImage ? (
        <div
          aria-hidden
          className={slots.overlay()}
          style={{ backgroundColor: color, opacity: overlayOpacity }}
        />
      ) : null}

      <div className={slots.body()}>
        <div className={slots.header()}>
          <Chip
            className={slots.category({ className: categoryClassName })}
            style={{ backgroundColor: accentColor, color: foregroundColor }}
          >
            <span aria-hidden className={slots.categoryIcon()}>
              {categoryIcon ?? <BarbellHorizontal size={chipIconSize} />}
            </span>
            <Chip.Label>{category}</Chip.Label>
          </Chip>

          <Typography
            className={slots.date()}
            type={META_TYPE[size]}
            weight="bold"
          >
            {date}
          </Typography>
        </div>

        <Typography
          className={slots.title()}
          type={TITLE_TYPE[size]}
          weight="bold"
        >
          {title}
        </Typography>

        <div className={slots.footer()}>
          <div className={slots.meta()}>
            <span className={slots.metaItem()}>
              <User
                aria-hidden
                className={slots.metaIcon()}
                size={metaIconSize}
              />
              {brandAwareText(author)}
            </span>
            <span className={slots.metaItem()}>
              <Clock
                aria-hidden
                className={slots.metaIcon()}
                size={metaIconSize}
              />
              <Typography type={META_TYPE[size]}>{duration}</Typography>
            </span>
          </div>

          <Button
            aria-label={actionLabel}
            className={slots.action({ className: actionClassName })}
            isIconOnly
            onPress={onAction}
            size="lg"
            style={{ backgroundColor: accentColor, color: arrowColor }}
            variant="ghost"
          >
            <ArrowUpRight size={arrowSize} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
