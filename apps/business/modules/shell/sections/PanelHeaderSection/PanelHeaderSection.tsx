"use client";

import { Button, Drawer, SearchField } from "@heroui/react";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";
import { cn } from "@theme/cn";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ButtonLink } from "@/components/button-link";

import { panelHeaderSectionStyles } from "./PanelHeaderSection.styles";
import type { PanelHeaderSectionProps } from "./PanelHeaderSection.types";

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PanelHeaderSection({
  searchPlaceholder,
  settingsHref,
  settingsLabel,
  notificationsLabel,
  menuLabel,
  openMenuLabel,
  closeMenuLabel,
  addHref,
  addLabel,
  items,
}: PanelHeaderSectionProps) {
  const styles = panelHeaderSectionStyles();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <header className={styles.root()}>
      <Button
        isIconOnly
        variant="tertiary"
        aria-label={menuOpen ? closeMenuLabel : openMenuLabel}
        aria-expanded={menuOpen}
        className={styles.menuBtn()}
        onPress={() => setMenuOpen(true)}
      >
        <Icon name="hamburger" />
      </Button>

      <SearchField
        name="panel-search"
        variant="secondary"
        className={styles.search()}
      >
        <SearchField.Group className="panel-search-group w-full">
          <Icon name="magnifying-glass" className="shrink-0 text-muted" />
          <SearchField.Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
          />
          <Icon name="funnel-1" className="ms-1 shrink-0 text-muted" />
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
        <Button
          isIconOnly
          variant="primary"
          aria-label={notificationsLabel}
          className={styles.notifyBtn()}
        >
          <Icon name="bell-1" />
        </Button>
      </div>

      <Drawer.Backdrop
        isOpen={menuOpen}
        onOpenChange={setMenuOpen}
        variant="blur"
        className="lg:hidden"
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className={styles.drawerDialog()}>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>{menuLabel}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <nav className={styles.drawerNav()} aria-label={menuLabel}>
                <ButtonLink
                  href={addHref}
                  className={styles.drawerAdd()}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="plus-fat" size="lg" />
                  <span>{addLabel}</span>
                </ButtonLink>
                {items.map((item) => {
                  const active = isActive(pathname, item.href, item.exact);
                  return (
                    <ButtonLink
                      key={`${item.icon}-${item.href}`}
                      href={item.href}
                      className={cn(
                        styles.drawerItem(),
                        active && styles.drawerItemActive(),
                      )}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon name={item.icon} size="lg" />
                      <span>{item.label}</span>
                    </ButtonLink>
                  );
                })}
              </nav>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </header>
  );
}
