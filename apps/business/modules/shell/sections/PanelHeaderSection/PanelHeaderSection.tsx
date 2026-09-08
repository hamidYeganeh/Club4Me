"use client";

import { Button, Drawer, SearchField } from "@heroui/react";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";
import { cn } from "@theme/cn";
import { businessPageTitle } from "@/components/business-page-intro";
import Link from "next/link";
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

  settingsHref,
  settingsLabel,

  menuLabel,
  openMenuLabel,
  closeMenuLabel,
  addHref,
  addLabel,
  items,
}: PanelHeaderSectionProps) {
  const styles = panelHeaderSectionStyles();
  const pathname = usePathname();
  const [menuSearch, setMenuSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <>
    <header className={styles.root()}>
      {pathname.split("/").filter(Boolean).length > 1 ? (
        <ButtonLink href={pathname.endsWith("/edit") ? pathname.slice(0,-5) : pathname.endsWith("/reservations") ? pathname.slice(0,-13) : pathname.includes("/classes") ? "/classes" : "/clubs"} isIconOnly variant="tertiary" aria-label="بازگشت" className="app-icon-button"><Icon name="chevron-right" /></ButtonLink>
      ) : (
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

      )}
      <p className="min-w-0 flex-1 truncate text-base font-bold">{businessPageTitle(pathname)}</p>

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
              <SearchField value={menuSearch} onChange={setMenuSearch} className="mb-4 w-full">
                <SearchField.Group><SearchField.Input aria-label="جستجو در بخش‌ها" placeholder="جستجو در بخش‌ها" /></SearchField.Group>
              </SearchField>
              <nav className={styles.drawerNav()} aria-label={menuLabel}>
                <ButtonLink
                  href={addHref}
                  className={styles.drawerAdd()}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="plus-fat" size="lg" />
                  <span>{addLabel}</span>
                </ButtonLink>
                {items.filter(item => item.label.includes(menuSearch.trim())).map((item) => {
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
    <nav className="business-bottom-nav" aria-label="دسترسی سریع">
      {items.filter(item => ["/", "/clubs", "/calendar", "/classes"].includes(item.href)).map(item => <Link key={item.href} href={item.href} aria-current={isActive(pathname,item.href,item.exact) ? "page" : undefined}><Icon name={item.icon} size={21} /><span>{item.label}</span></Link>)}
      <button type="button" onClick={() => setMenuOpen(true)} aria-label={openMenuLabel}><Icon name="hamburger" size={21} /><span>بیشتر</span></button>
    </nav>
    </>
  );
}
