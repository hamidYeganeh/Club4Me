"use client";

import { Card, Typography } from "@heroui/react";

import { useFallbackImageSrc } from "../use-fallback-image-src";
import { cityCardStyles } from "./city-card.styles";
import type { CityCardProps } from "./city-card.types";

/** Stronger blur toward the bottom so titles stay readable on busy photos. */
const BLUR_LAYERS = [
  { blur: 1, stop: 78 },
  { blur: 2, stop: 64 },
  { blur: 4, stop: 50 },
  { blur: 8, stop: 36 },
  { blur: 14, stop: 24 },
  { blur: 22, stop: 14 },
  { blur: 32, stop: 6 },
] as const;

export function CityCard({
  label,
  title,
  imageUrl,
  imageAlt,
  href,
  className,
}: CityCardProps) {
  const styles = cityCardStyles();
  const { src: resolvedImageUrl, onError: onImageError } =
    useFallbackImageSrc(imageUrl);

  return (
    <Card variant="transparent" className={styles.root({ className })}>
      <img
        src={resolvedImageUrl}
        alt={imageAlt ?? title}
        className={styles.image()}
        onError={onImageError}
      />

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
        {label ? (
          <Typography type="body-xs" className={styles.label()}>
            {label}
          </Typography>
        ) : null}
        <Card.Title className={styles.title()}>{title}</Card.Title>
      </div>
    </Card>
  );
}
