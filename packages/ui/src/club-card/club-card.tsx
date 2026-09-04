"use client";

import { Button, Card, Chip, Typography } from "@heroui/react";
import { Icon } from "@repo/theme/icon";

import { clubCardStyles } from "./club-card.styles";
import type { ClubCardProps } from "./club-card.types";

const MAX_RATING = 5;

function displayRating(rating: number) {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

export function ClubCard({
  variant = "compact",
  title,
  imageUrl,
  imageAlt,
  location,
  description,
  rating,
  reviewsCount,
  amenities = [],
  price,
  pricePrefix = "From",
  priceSuffix,
  actionLabel,
  href,
  onActionPress,
  onFavoritePress,
  onSharePress,
  favoriteAriaLabel = "Add to favorites",
  shareAriaLabel = "Share club",
  className,
}: ClubCardProps) {
  const styles = clubCardStyles({ variant });
  const isEditorial = variant === "editorial";
  const safeRating =
    typeof rating === "number"
      ? Math.min(MAX_RATING, Math.max(0, rating))
      : undefined;
  const visibleAmenities = amenities.filter(({ label }) => label.trim());
  const detail = location || description;

  return (
    <Card variant="transparent" className={styles.root({ className })}>
      <img className={styles.image()} src={imageUrl} alt={imageAlt ?? title} />
      <div aria-hidden className={styles.shade()} />

      {href ? (
        <a href={href} aria-label={title} className={styles.link()} />
      ) : null}

      <div className={styles.content()}>
        <div className={styles.top()}>
          {safeRating != null ? (
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
            {onSharePress ? (
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
                <Icon name="heart" size={19} />
              </Button>
            ) : null}
          </div>
        </div>

        <div className={styles.body()}>
          <div className={styles.heading()}>
            <div className={styles.identity()}>
              <Card.Title className={styles.title()}>{title}</Card.Title>
              {detail ? (
                <div className={styles.details()}>
                  {location ? (
                    <Icon
                      name="pin-1"
                      size={16}
                      className={styles.detailIcon()}
                    />
                  ) : null}
                  <Typography type="body-sm" className={styles.detailText()}>
                    {[location, description].filter(Boolean).join(" · ")}
                  </Typography>
                </div>
              ) : null}
            </div>

            {!isEditorial ? (
              <div className={styles.bottom()}>
                <div className={styles.priceBlock()}>
                  <div className={styles.priceLine()}>
                    <span className={styles.price()}>{price}</span>
                    {priceSuffix ? (
                      <span className={styles.priceSuffix()}>
                        {priceSuffix}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button
                  className={styles.action()}
                  variant="primary"
                  onPress={onActionPress}
                >
                  {actionLabel}
                </Button>
              </div>
            ) : null}
          </div>

          {isEditorial ? (
            <>
              {visibleAmenities.length > 0 ? (
                <div className={styles.amenityList()} aria-label="Amenities">
                  {visibleAmenities.map((amenity, index) => (
                    <Chip
                      key={amenity.id ?? `${amenity.label}-${index}`}
                      size="sm"
                      className={styles.amenity()}
                    >
                      <Chip.Label>
                        <span className={styles.amenityInner()}>
                          {amenity.icon ? (
                            <Icon
                              name={amenity.icon}
                              size={15}
                              className={styles.amenityIcon()}
                            />
                          ) : null}
                          {amenity.label}
                        </span>
                      </Chip.Label>
                    </Chip>
                  ))}
                </div>
              ) : null}

              <div aria-hidden className={styles.divider()} />
              <div className={styles.bottom()}>
                <div className={styles.priceBlock()}>
                  {pricePrefix ? (
                    <div className={styles.pricePrefix()}>{pricePrefix}</div>
                  ) : null}
                  <div className={styles.priceLine()}>
                    <span className={styles.price()}>{price}</span>
                    {priceSuffix ? (
                      <span className={styles.priceSuffix()}>
                        {priceSuffix}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button
                  className={styles.action()}
                  variant="primary"
                  onPress={onActionPress}
                >
                  {actionLabel}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
