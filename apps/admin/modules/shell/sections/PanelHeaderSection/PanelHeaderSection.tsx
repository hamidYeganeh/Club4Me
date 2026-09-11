"use client";

import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";

import { ButtonLink } from "@/components/button-link";

import { panelHeaderSectionStyles } from "./PanelHeaderSection.styles";
import type { PanelHeaderSectionProps } from "./PanelHeaderSection.types";

export function PanelHeaderSection({
  settingsHref,
  settingsLabel,
}: PanelHeaderSectionProps) {
  const styles = panelHeaderSectionStyles();

  return (
    <header className={styles.root()}>
      <p className="text-sm font-semibold">مدیریت جیم‌فورمی</p>
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
      </div>
    </header>
  );
}
