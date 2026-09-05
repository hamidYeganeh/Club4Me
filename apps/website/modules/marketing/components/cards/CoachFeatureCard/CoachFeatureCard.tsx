"use client";

import { Chip } from "@heroui/react/chip";
import { CloseButton } from "@heroui/react/close-button";
import { Typography } from "@heroui/react/typography";
import { Briefcase1 } from "@modules/marketing/icons/icons/Briefcase1";
import { SealCheck } from "@modules/marketing/icons/icons/SealCheck";
import { StarFull } from "@modules/marketing/icons/icons/StarFull";
import type { KeyboardEvent } from "react";
import { MediaImage } from "../../common/MediaImage";
import { coachFeatureCardVariants } from "./CoachFeatureCard.styles";
import type { CoachFeatureCardProps } from "./CoachFeatureCard.types";

const DEFAULT_MAX_RATING = 5;

function formatRating(rating: number) {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function clampRating(rating: number, max: number) {
  if (!Number.isFinite(rating)) return 0;
  return Math.min(Math.max(rating, 0), max);
}

function StarRow({
  rating,
  maxRating,
  starsClassName,
  starClassName,
  starEmptyClassName,
}: {
  rating: number;
  maxRating: number;
  starsClassName: string;
  starClassName: string;
  starEmptyClassName: string;
}) {
  const filled = Math.round(clampRating(rating, maxRating));

  return (
    <div
      aria-label={`${formatRating(rating)} / ${maxRating}`}
      className={starsClassName}
      role="img"
    >
      {Array.from({ length: maxRating }, (_, index) => (
        <StarFull
          key={index}
          className={index < filled ? starClassName : starEmptyClassName}
          size={14}
        />
      ))}
    </div>
  );
}

export function CoachFeatureCard({
  image,
  imageAlt = "",
  title,
  specialty,
  rating,
  maxRating = DEFAULT_MAX_RATING,
  ratingCount,
  isNew = false,
  newLabel = "New",
  closeLabel = "Close",
  onClose,
  onPress,
  onClick,
  certifiedLabel,
  experienceLabel,
  imageClassName,
  className,
  ...props
}: CoachFeatureCardProps) {
  const slots = coachFeatureCardVariants();
  const showRating = rating != null;
  const showTopBar = isNew || onClose != null;
  const isPressable = onPress != null || onClick != null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    props.onKeyDown?.(event);
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

  return (
    <div
      {...props}
      className={slots.root({ className })}
      data-pressable={isPressable || undefined}
      onClick={(event) => {
        if (onPress) {
          void onPress({} as never);
          return;
        }
        onClick?.(event);
      }}
      onKeyDown={handleKeyDown}
      role={isPressable ? "button" : undefined}
      tabIndex={isPressable ? 0 : props.tabIndex}
    >
      <div className={slots.media()}>
        <MediaImage
          alt={imageAlt}
          className={slots.image({ className: imageClassName })}
          image={image}
          sizes="280px"
        />
        <div aria-hidden className={slots.mediaScrim()} />
      </div>

      {showTopBar ? (
        <div className={slots.topBar()}>
          {isNew ? (
            <Chip className={slots.newBadge()} size="sm">
              <Chip.Label>{newLabel}</Chip.Label>
            </Chip>
          ) : (
            <span />
          )}
          {onClose != null ? (
            <CloseButton
              aria-label={closeLabel}
              className={slots.closeButton()}
              onClick={(event) => event.stopPropagation()}
              onPress={onClose}
            />
          ) : (
            <span />
          )}
        </div>
      ) : null}

      <div className={slots.body()}>
        <Typography className={slots.title()} type="h4" weight="bold">
          {title}
        </Typography>
        {specialty != null && specialty !== "" ? (
          <Typography className={slots.specialty()} type="body-sm">
            {specialty}
          </Typography>
        ) : null}

        {showRating ? (
          <div className={slots.ratingRow()}>
            <Typography className={slots.ratingText()} type="body-sm">
              {ratingCount != null ? (
                <span className={slots.ratingCount()}>({ratingCount}) </span>
              ) : null}
              {formatRating(rating)}
            </Typography>
            <StarRow
              maxRating={maxRating}
              rating={rating}
              starClassName={slots.star()}
              starEmptyClassName={slots.starEmpty()}
              starsClassName={slots.stars()}
            />
          </div>
        ) : null}

        {certifiedLabel != null || experienceLabel != null ? (
          <div className={slots.meta()}>
            {experienceLabel != null ? (
              <span className={slots.metaItem()}>
                <Briefcase1
                  aria-hidden
                  className={slots.metaIconMuted()}
                  size={14}
                />
                {experienceLabel}
              </span>
            ) : (
              <span />
            )}
            {certifiedLabel != null ? (
              <span className={slots.metaItem()}>
                <SealCheck
                  aria-hidden
                  className={slots.metaIconSuccess()}
                  size={14}
                />
                {certifiedLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
