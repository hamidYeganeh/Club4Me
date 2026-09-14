"use client";

import { PanelMobileMenu } from "@repo/ui/panel-navigation";
import { usePathname } from "next/navigation";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";

import { ButtonLink } from "@/components/button-link";

import { panelHeaderSectionStyles } from "./PanelHeaderSection.styles";
import type { PanelHeaderSectionProps } from "./PanelHeaderSection.types";

export function PanelHeaderSection({
  items,
  settingsHref,
  settingsLabel,
}: PanelHeaderSectionProps) {
  const pathname = usePathname();
  const styles = panelHeaderSectionStyles();

  return (
    <header className={styles.root()}>
      <PanelMobileMenu key={pathname} items={items} pathname={pathname} />
      <p className="text-sm font-semibold">مدیریت کلاب‌فورمی</p>
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
