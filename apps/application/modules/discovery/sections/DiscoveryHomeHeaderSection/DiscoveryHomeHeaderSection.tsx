"use client";

import { Typography } from "@heroui/react";
import { ThemeToggle } from "@theme/theme-toggle";
import { ActiveLocationSelector } from "@modules/locations/components/ActiveLocationSelector";

import { discoveryHomeHeaderSectionStyles } from "./DiscoveryHomeHeaderSection.styles";
import type { DiscoveryHomeHeaderSectionProps } from "./DiscoveryHomeHeaderSection.types";

export function DiscoveryHomeHeaderSection({
  title,
}: DiscoveryHomeHeaderSectionProps) {
  const styles = discoveryHomeHeaderSectionStyles();

  return (
    <>
      <header className={styles.root()}>
        <div className={styles.lead()}>
          <Typography type="h4" className={styles.title()}>
            {title}
          </Typography>
          <ActiveLocationSelector />
        </div>
        <ThemeToggle />
      </header>
      <div aria-hidden className={styles.spacer()} />
    </>
  );
}
