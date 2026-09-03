"use client";

import { Avatar, Badge, Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import Link from "next/link";
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
      >
        <Icon name="plus-fat" size="lg" />
      </ButtonLink>
      <nav className={styles.nav()} aria-label={addLabel}>
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={`${item.icon}-${item.href}`}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(styles.item(), active && styles.itemActive())}
            >
              <Icon name={item.icon} size="lg" />
            </Link>
          );
        })}
      </nav>
      <div className={styles.avatarWrap()}>
        <Badge.Anchor>
          <Button
            isIconOnly
            variant="tertiary"
            aria-label={avatarAlt}
            className="rounded-full p-0"
          >
            <Avatar className="size-10">
              <Avatar.Image alt={avatarAlt} src={avatarSrc} />
              <Avatar.Fallback>{avatarAlt.slice(0, 1)}</Avatar.Fallback>
            </Avatar>
          </Button>
          <Badge color="danger" size="sm">
            {badge}
          </Badge>
        </Badge.Anchor>
      </div>
    </aside>
  );
}
