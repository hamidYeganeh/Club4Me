"use client";

import { Avatar, Badge, Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import { usePathname } from "next/navigation";

import { ButtonLink } from "@/components/button-link";

import { panelRailSectionStyles } from "./PanelRailSection.styles";
import type { PanelRailSectionProps } from "./PanelRailSection.types";

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PanelRailSection({
  items,
  addHref,
  addLabel,
  avatarSrc,
  avatarAlt,
  badge,
}: PanelRailSectionProps) {
  const pathname = usePathname();
  const styles = panelRailSectionStyles();

  return (
    <aside className={styles.root()}>
      <ButtonLink
        href={addHref}
        isIconOnly
        aria-label={addLabel}
        className={styles.add()}
        variant="primary"
      >
        <Icon name="plus-fat" size="lg" />
      </ButtonLink>
      <nav className={styles.nav()} aria-label={addLabel}>
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <ButtonLink
              key={`${item.icon}-${item.href}`}
              href={item.href}
              isIconOnly
              aria-label={item.label}
              variant="ghost"
              className={cn(styles.item(), active && styles.itemActive())}
            >
              {active ? <span className={styles.activeMark()} aria-hidden /> : null}
              <Icon name={item.icon} size="lg" />
            </ButtonLink>
          );
        })}
      </nav>
      <div className={styles.avatarWrap()}>
        <Badge.Anchor>
          <Button
            isIconOnly
            variant="tertiary"
            aria-label={avatarAlt}
            className={styles.avatarBtn()}
          >
            <Avatar className="size-10 rounded-[0.85rem]">
              <Avatar.Image alt={avatarAlt} src={avatarSrc} />
              <Avatar.Fallback>{avatarAlt.slice(0, 1)}</Avatar.Fallback>
            </Avatar>
          </Button>
          <Badge color="accent" size="sm">
            {badge}
          </Badge>
        </Badge.Anchor>
      </div>
    </aside>
  );
}
