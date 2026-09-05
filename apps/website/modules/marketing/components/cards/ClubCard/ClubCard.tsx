"use client";

import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Separator } from "@heroui/react/separator";
import { ArrowUpload } from "@modules/marketing/icons/icons/ArrowUpload";
import { ArrowUpRight } from "@modules/marketing/icons/icons/ArrowUpRight";
import { Heart } from "@modules/marketing/icons/icons/Heart";
import { MapPin1 } from "@modules/marketing/icons/icons/MapPin1";
import { StarFull } from "@modules/marketing/icons/icons/StarFull";
import { MediaImage } from "../../common/MediaImage";
import { clubCardVariants } from "./ClubCard.styles";
import type { ClubCardProps } from "./ClubCard.types";

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

export function ClubCard({
  orientation = "horizontal",
  image,
  imageAlt = "",
  title,
  subtitle,
  rating,
  maxRating = DEFAULT_MAX_RATING,
  ratingCount,
  features,
  statusLabel,
  pricePrefix,
  price,
  priceSuffix,
  actionLabel,
  onAction,
  onShare,
  onFavorite,
  isFavorite = false,
  shareLabel = "Share",
  favoriteLabel = "Favorite",
  imageClassName,
  className,
  onClick,
  onKeyDown,
  ...props
}: ClubCardProps) {
  const slots = clubCardVariants({ orientation });
  const isVertical = orientation === "vertical";
  const isListing = orientation === "listing";
  const showTopBar = !isVertical;
  const showRating = rating != null;
  const showStatus = statusLabel != null && statusLabel !== "";
  const showSubtitle = subtitle != null && subtitle !== "";
  const showFeatures = features != null && features.length > 0;
  const showPrice =
    (price != null && price !== "") ||
    (pricePrefix != null && pricePrefix !== "") ||
    (priceSuffix != null && priceSuffix !== "");
  const showListingFooter =
    isListing && (title != null || showPrice || showSubtitle || showFeatures);

  return (
    <Card
      className={slots.root({ className })}
      data-orientation={orientation}
      variant="transparent"
      {...props}
      {...(isListing && onAction
        ? {
            onClick: (event) => {
              onClick?.(event);
              if (!event.defaultPrevented) onAction();
            },
            role: "button",
            tabIndex: 0,
            onKeyDown: (event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onAction();
              }
            },
          }
        : { onClick, onKeyDown })}
    >
      <div className={slots.media()}>
        <MediaImage
          alt={imageAlt}
          className={slots.image({ className: imageClassName })}
          image={image}
          sizes="(max-width: 768px) 100vw, 360px"
        />
        <div aria-hidden className={slots.mediaScrim()} />
      </div>

      {showTopBar ? (
        <div className={slots.topBar()}>
          {isListing ? (
            <span />
          ) : showRating ? (
            <Chip className={slots.ratingChip()} size="sm" variant="primary">
              <StarFull className={slots.ratingChipIcon()} size={14} />
              <Chip.Label>
                {formatRating(rating)}
                {ratingCount != null ? (
                  <span className={slots.ratingCount()}> ({ratingCount})</span>
                ) : null}
              </Chip.Label>
            </Chip>
          ) : (
            <span />
          )}

          <div className={slots.actions()}>
            <Button
              aria-label={shareLabel}
              className={isListing ? slots.shareButton() : slots.iconButton()}
              isIconOnly
              onPress={onShare}
              size="lg"
              variant={isListing ? "primary" : "secondary"}
            >
              {isListing ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowUpload size={16} />
              )}
            </Button>
            <Button
              aria-label={favoriteLabel}
              aria-pressed={isFavorite}
              className={slots.iconButton({
                className: [
                  isListing ? slots.favoriteButton() : undefined,
                  isFavorite ? "text-danger" : undefined,
                ]
                  .filter(Boolean)
                  .join(" "),
              })}
              isIconOnly
              onPress={onFavorite}
              size="lg"
              variant={
                isListing
                  ? isFavorite
                    ? "danger"
                    : "tertiary"
                  : isFavorite
                    ? "danger"
                    : "danger-soft"
              }
            >
              <Heart size={16} />
            </Button>
          </div>
        </div>
      ) : null}

      <div className={slots.body()}>
        {isListing ? (
          <>
            {showStatus || showRating ? (
              <div className={slots.badges()}>
                {showStatus ? (
                  <Chip
                    className={slots.statusBadge()}
                    size="sm"
                    variant="primary"
                  >
                    <span aria-hidden className={slots.statusDot()} />
                    <Chip.Label>{statusLabel}</Chip.Label>
                  </Chip>
                ) : null}
                {showRating ? (
                  <Chip
                    className={slots.statusBadge()}
                    size="sm"
                    variant="primary"
                  >
                    <StarFull
                      className="size-3.5 shrink-0 text-accent"
                      size={14}
                    />
                    <Chip.Label>{formatRating(rating)}</Chip.Label>
                  </Chip>
                ) : null}
              </div>
            ) : null}

            {showListingFooter ? (
              <>
                <div className={slots.titleRow()}>
                  <Card.Title className={slots.title()}>{title}</Card.Title>
                  {showPrice ? (
                    <div className={slots.priceGroup()}>
                      {pricePrefix != null && pricePrefix !== "" ? (
                        <span className={slots.pricePrefix()}>
                          {pricePrefix}
                        </span>
                      ) : null}
                      {price != null && price !== "" ? (
                        <span className={slots.price()}>{price}</span>
                      ) : null}
                      {priceSuffix != null && priceSuffix !== "" ? (
                        <span className={slots.priceSuffix()}>
                          {priceSuffix}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {showSubtitle ? (
                  <Card.Description className={slots.subtitle()}>
                    {subtitle}
                  </Card.Description>
                ) : null}

                {showFeatures ? (
                  <div className={slots.features()}>
                    {features.map((feature, index) => (
                      <Chip
                        className={slots.listingFeature()}
                        key={index}
                        size="sm"
                        variant="primary"
                      >
                        {feature.icon != null ? (
                          <span aria-hidden>{feature.icon}</span>
                        ) : null}
                        <Chip.Label>{feature.label}</Chip.Label>
                      </Chip>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : isVertical ? (
          <>
            {showRating ? (
              <StarRow
                maxRating={maxRating}
                rating={rating}
                starClassName={slots.star()}
                starEmptyClassName={slots.starEmpty()}
                starsClassName={slots.stars()}
              />
            ) : null}

            <Card.Header className={slots.header()}>
              <Card.Title className={slots.title()}>{title}</Card.Title>
              {showSubtitle ? (
                <Card.Description className={slots.location()}>
                  <MapPin1
                    aria-hidden
                    className={slots.locationIcon()}
                    size={14}
                  />
                  <span className="min-w-0 truncate">{subtitle}</span>
                </Card.Description>
              ) : null}
            </Card.Header>

            {showFeatures ? (
              <div className={slots.features()}>
                {features.map((feature, index) => (
                  <Chip key={index} size="sm" variant="primary">
                    {feature.icon != null ? (
                      <span aria-hidden>{feature.icon}</span>
                    ) : null}
                    <Chip.Label>{feature.label}</Chip.Label>
                  </Chip>
                ))}
              </div>
            ) : null}

            {showPrice || actionLabel ? (
              <>
                <Separator className={slots.divider()} />
                <div className={slots.footer()}>
                  {showPrice ? (
                    <div className={slots.priceGroup()}>
                      {pricePrefix != null && pricePrefix !== "" ? (
                        <span className={slots.pricePrefix()}>
                          {pricePrefix}
                        </span>
                      ) : null}
                      {price != null && price !== "" ? (
                        <span className={slots.price()}>{price}</span>
                      ) : null}
                      {priceSuffix != null && priceSuffix !== "" ? (
                        <span className={slots.priceSuffix()}>
                          {priceSuffix}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span />
                  )}
                  {actionLabel ? (
                    <Button onPress={onAction} size="sm" variant="primary">
                      {actionLabel}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <>
            <Card.Header className={slots.header()}>
              <Card.Title className={slots.title()}>{title}</Card.Title>
              {showSubtitle ? (
                <Card.Description className={slots.subtitle()}>
                  {subtitle}
                </Card.Description>
              ) : null}
            </Card.Header>

            <div className={slots.ctaGroup()}>
              {showPrice ? (
                <span className={slots.priceGroup()}>
                  {pricePrefix != null && pricePrefix !== "" ? (
                    <span className={slots.pricePrefix()}>{pricePrefix}</span>
                  ) : null}
                  {price != null && price !== "" ? (
                    <span className={slots.price()}>{price}</span>
                  ) : null}
                  {priceSuffix != null && priceSuffix !== "" ? (
                    <span className={slots.priceSuffix()}>{priceSuffix}</span>
                  ) : null}
                </span>
              ) : null}
              {actionLabel ? (
                <Button
                  className={slots.action()}
                  onPress={onAction}
                  size="sm"
                  variant="primary"
                >
                  {actionLabel}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
