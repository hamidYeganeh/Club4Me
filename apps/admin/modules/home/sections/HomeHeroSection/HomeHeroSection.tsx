"use client";

import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";

import { homeHeroSectionStyles } from "./HomeHeroSection.styles";
import type { HomeHeroSectionProps } from "./HomeHeroSection.types";

export function HomeHeroSection({
  title,
  description,
  meta,
  ctaLabel,
}: HomeHeroSectionProps) {
  const styles = homeHeroSectionStyles();

  return (
    <main className={styles.root()}>
      <div className={styles.toggle()}>
        <ThemeToggle />
      </div>
      <h1 className={styles.title()}>{title}</h1>
      <p className={styles.description()}>{description}</p>
      <p className={styles.meta()}>{meta}</p>
      <Button variant="primary">
        <Icon name="arrow-left" />
        {ctaLabel}
      </Button>
    </main>
  );
}
