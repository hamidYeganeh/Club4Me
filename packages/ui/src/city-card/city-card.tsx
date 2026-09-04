"use client";

import { Card, Typography } from "@heroui/react";

import { cityCardStyles } from "./city-card.styles";
import type { CityCardProps } from "./city-card.types";

const BLUR_LAYERS = [
  { blur: 1, stop: 72 },
  { blur: 2, stop: 58 },
  { blur: 4, stop: 46 },
  { blur: 8, stop: 34 },
  { blur: 16, stop: 22 },
  { blur: 28, stop: 12 },
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
        <Typography type="body-xs" className={styles.label()}>
          {label}
        </Typography>
        <Card.Title className={styles.title()}>{title}</Card.Title>
      </div>
    </Card>
  );
}
