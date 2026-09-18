"use client";

import type { CSSProperties } from "react";
import { Button, Card, Typography } from "@heroui/react";
import { Icon } from "@repo/theme/icon";

import { useFallbackImageSrc } from "../use-fallback-image-src";
import { clubCardStyles } from "./club-card.styles";
import type { ClubCardProps } from "./club-card.types";

const MAX_RATING = 5;
const MAX_VISIBLE_SPORTS = 2;
const OVERLAY_MAX_VISIBLE_SPORTS = 3;
const OVERLAY_BLUR_LAYERS = [2, 4, 8, 16] as const;

function displayRating(rating: number) {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

export function ClubCard({
  variant = "compact",
  title,
  imageUrl,
  imageAlt,
  location,
  rating,
  reviewsCount,
  sports = [],
  price,
  pricePrefix,
  priceSuffix,
  href,
  onFavoritePress,
  onSharePress,
  favoriteAriaLabel = "Save club",
  shareAriaLabel = "Share club",
  className,
}: ClubCardProps) {
  const isOverlay = variant === "overlay";
  const styles = clubCardStyles({ variant });
  const { src: resolvedImageUrl, onError: onImageError } =
    useFallbackImageSrc(imageUrl);
  const safeRating =
    typeof rating === "number"
      ? Math.min(MAX_RATING, Math.max(0, rating))
      : undefined;
  const visibleSports = sports.filter(
    ({ label, icon }) => label.trim() && icon,
  );
  const maxSports = isOverlay ? OVERLAY_MAX_VISIBLE_SPORTS : MAX_VISIBLE_SPORTS;
  const shownSports = visibleSports.slice(0, maxSports);
  const hiddenSportsCount = Math.max(
    0,
    visibleSports.length - shownSports.length,
  );
  const hasPrice = Boolean(price?.trim());

  return (
    <Card variant="transparent" className={styles.root({ className })}>
      <img
        className={styles.image()}
        src={resolvedImageUrl}
        alt={imageAlt ?? title}
        loading="lazy"
        decoding="async"
        onError={onImageError}
      />

      {isOverlay ? (
        <div aria-hidden className={styles.shadeEdge()}>
          <div className={styles.shadeGradient()} />
          {OVERLAY_BLUR_LAYERS.map((blur, index) => (
            <div
              key={blur}
              className={styles.shadeBlur()}
              style={
                {
                  "--blur": `${blur}px`,
                  "--reach": `${100 - index * 20}%`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : (
        <div aria-hidden className={styles.shade()} />
      )}

      {href ? (
        <a href={href} aria-label={title} className={styles.link()} />
      ) : null}

      <div className={styles.content()}>
        <div className={styles.top()}>
          {isOverlay ? (
            hasPrice ? (
              <div className={styles.priceBadge()}>
                {pricePrefix ? (
                  <span className={styles.priceBadgeSuffix()}>{pricePrefix}</span>
                ) : null}
                <span className={styles.priceBadgeAmount()}>{price}</span>
                {priceSuffix ? (
                  <span className={styles.priceBadgeSuffix()}>{priceSuffix}</span>
                ) : null}
              </div>
            ) : (
              <span />
            )
          ) : safeRating != null ? (
            <div
              className={styles.rating()}
              aria-label={`${displayRating(safeRating)} out of ${MAX_RATING}${
                reviewsCount != null ? `, ${reviewsCount} reviews` : ""
              }`}
            >
              <Icon
                name="star-full"
                size={17}
                className={styles.ratingIcon()}
              />
              <Typography type="body-sm" className={styles.ratingText()}>
                {displayRating(safeRating)}
              </Typography>
              {reviewsCount != null ? (
                <Typography type="body-sm" className={styles.reviews()}>
                  ({reviewsCount})
                </Typography>
              ) : null}
            </div>
          ) : (
            <span />
          )}

          <div className={styles.actions()}>
            {!isOverlay && onSharePress ? (
              <Button
                isIconOnly
                size="sm"
                variant="outline"
                aria-label={shareAriaLabel}
                className={styles.iconButton()}
                onPress={onSharePress}
              >
                <Icon name="arrow-share" size={18} />
              </Button>
            ) : null}
            {onFavoritePress ? (
              <Button
                isIconOnly
                size="sm"
                variant="outline"
                aria-label={favoriteAriaLabel}
                className={styles.iconButton()}
                onPress={onFavoritePress}
              >
                <Icon name="bookmark" size={19} />
              </Button>
            ) : null}
          </div>
        </div>

        <div className={styles.body()}>
          <div className={styles.bottom()}>
            <div className={styles.identity()}>
              {isOverlay ? (
                <div className={styles.titleRow()}>
                  <Card.Title className={styles.title()}>{title}</Card.Title>
                  {safeRating != null ? (
                    <div
                      className={styles.titleRating()}
                      aria-label={`${displayRating(safeRating)} out of ${MAX_RATING}${
                        reviewsCount != null
                          ? `, ${reviewsCount} reviews`
                          : ""
                      }`}
                    >
                      <Icon
                        name="star-full"
                        size={15}
                        className={styles.ratingIcon()}
                      />
                      <Typography
                        type="body-sm"
                        className={styles.ratingText()}
                      >
                        {displayRating(safeRating)}
                      </Typography>
                      {reviewsCount != null ? (
                        <Typography
                          type="body-sm"
                          className={styles.reviews()}
                        >
                          ({reviewsCount})
                        </Typography>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <Card.Title className={styles.title()}>{title}</Card.Title>
              )}

              {location ? (
                <div className={styles.details()}>
                  <Icon
                    name="pin-1"
                    size={16}
                    className={styles.detailIcon()}
                  />
                  <Typography type="body-sm" className={styles.detailText()}>
                    {location}
                  </Typography>
                </div>
              ) : null}

              {shownSports.length > 0 ? (
                <div
                  className={styles.sports()}
                  aria-label={visibleSports
                    .map((sport) => sport.label)
                    .join(", ")}
                >
                  {shownSports.map((sport, index) => (
                    <span
                      key={sport.id ?? `${sport.label}-${index}`}
                      className={styles.sport()}
                    >
                      <Icon
                        name={sport.icon}
                        size={14}
                        className={styles.sportIcon()}
                      />
                      <span className={styles.sportLabel()}>{sport.label}</span>
                    </span>
                  ))}
                  {hiddenSportsCount > 0 ? (
                    <span className={styles.sportMore()}>
                      +{hiddenSportsCount}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {!isOverlay && hasPrice ? (
              <div className={styles.priceBlock()}>
                {pricePrefix ? (
                  <div className={styles.pricePrefix()}>{pricePrefix}</div>
                ) : null}
                <div className={styles.priceLine()}>
                  <span className={styles.price()}>{price}</span>
                  {priceSuffix ? (
                    <span className={styles.priceSuffix()}>{priceSuffix}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
