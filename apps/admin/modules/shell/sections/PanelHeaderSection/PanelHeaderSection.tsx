"use client";

import { SearchField } from "@heroui/react";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";

import { ButtonLink } from "@/components/button-link";

import { panelHeaderSectionStyles } from "./PanelHeaderSection.styles";
import type { PanelHeaderSectionProps } from "./PanelHeaderSection.types";

export function PanelHeaderSection({
  searchPlaceholder,
  chatLabel,
  chatHref,
  settingsHref,
  settingsLabel,
}: PanelHeaderSectionProps) {
  const styles = panelHeaderSectionStyles();

  return (
    <header className={styles.root()}>
      <SearchField name="panel-search" variant="secondary" className={styles.search()}>
        <SearchField.Group className="w-full rounded-full">
          <SearchField.SearchIcon />
          <SearchField.Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
          />
          <Icon name="funnel-1" className="ms-1 text-muted" />
        </SearchField.Group>
      </SearchField>
      <div className={styles.actions()}>
        <ThemeToggle className={styles.iconBtn()} />
        <ButtonLink
          href={settingsHref}
          isIconOnly
          variant="tertiary"
          aria-label={settingsLabel}
          className={styles.iconBtn()}
        >
          <Icon name="gear-1" />
        </ButtonLink>
        <ButtonLink href={chatHref} variant="primary" className="rounded-full">
          <Icon name="sparkle-1" />
          {chatLabel}
        </ButtonLink>
      </div>
    </header>
  );
}
