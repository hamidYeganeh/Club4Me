"use client";

import { Typography } from "@heroui/react";
import { ThemeToggle } from "@theme/theme-toggle";

import { athleteScreenHeaderSectionStyles } from "./AthleteScreenHeaderSection.styles";
import type { AthleteScreenHeaderSectionProps } from "./AthleteScreenHeaderSection.types";

export function AthleteScreenHeaderSection({
  title,
}: AthleteScreenHeaderSectionProps) {
  const styles = athleteScreenHeaderSectionStyles();

  return (
    <>
      <header className={styles.root()}>
        <Typography type="h4" className={styles.title()}>
          {title}
        </Typography>
        <ThemeToggle />
      </header>
      <div aria-hidden className={styles.spacer()} />
    </>
  );
}
