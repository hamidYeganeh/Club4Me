"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAccountPreference } from "@api/preferences";
import { Icon, type IconName } from "@theme/icon";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { ProgressiveBlur } from "@/components/progressive-blur";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";
import styles from "./main-bottom-navigation.module.css";
import {
  ActiveIndicator,
  ActiveIndicatorGroup,
} from "@/components/motion/active-indicator";

type NavLabelKey = "home" | "discover" | "profile" | "reservations";

type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: IconName;
  exact?: boolean;
};

type NavConfig = {
  items: NavItem[];
  actionLabelKey: "add" | "search";
  actionIcon: IconName;
  actionHref: string;
};

function createRoleNav(role: "athlete" | "coach"): NavConfig {
  return {
    items: [
      { href: `/${role}`, labelKey: "home", icon: "house-1", exact: true },
      { href: "/discovery", labelKey: "discover", icon: "compass" },
      {
        href: `/${role}/reservations`,
        labelKey: "reservations",
        icon: "calendar-1",
      },
      { href: `/${role}/profile`, labelKey: "profile", icon: "user" },
    ],
    actionLabelKey: role === "coach" ? "add" : "search",
    actionIcon: role === "coach" ? "plus-fat" : "magnifying-glass",
    actionHref: role === "coach" ? "/coach/classes/new" : "/discovery/search",
  };
}

const athleteNav = createRoleNav("athlete");
const coachNav = createRoleNav("coach");

function getNavConfig(
  pathname: string,
  discoveryRole: "athlete" | "coach",
): NavConfig | null {
  // The bottom navigation belongs only to the role home and the root
  // discovery screen. Detail and nested screens should remain unobstructed.
  if (pathname === "/athlete") {
    return athleteNav;
  }

  if (pathname === "/coach") {
    return coachNav;
  }

  if (pathname === "/discovery") {
    return discoveryRole === "coach" ? coachNav : athleteNav;
  }

  return null;
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  if (item.labelKey === "profile") {
    const role = item.href.split("/")[1];
    if (
      ["settings", "favorites", "notifications", "benefits", "support"].some(
        (screen) => pathname === `/${role}/${screen}`,
      )
    )
      return true;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function MainBottomNavigation() {
  const pathname = usePathname();
  const keyboardOpen = useKeyboardOpen();
  const t = useTranslations("nav");
  const [savedRole, setLastRole] = useAccountPreference("active-role");
  const lastRole = savedRole === "coach" ? "coach" : "athlete";
  const routeRole = pathname.startsWith("/coach")
    ? "coach"
    : pathname.startsWith("/athlete")
      ? "athlete"
      : null;
  useEffect(() => {
    if (routeRole) setLastRole(routeRole);
  }, [routeRole, setLastRole]);
  const config = getNavConfig(pathname, routeRole ?? lastRole);

  if (!config || keyboardOpen) {
    return null;
  }

  const leading = config.items.slice(0, 2);
  const trailing = config.items.slice(2);

  return (
    <ActiveIndicatorGroup>
      <nav
        aria-label={t("main")}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl"
      >
        <div className="relative h-[var(--app-bottom-nav-height)]">
          <div className="absolute inset-0 overflow-hidden">
            <ProgressiveBlur
              direction="bottom"
              className="h-full"
              blurLayers={8}
              blurIntensity={1.25}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-background from-40% via-background/75 to-transparent"
            />
          </div>
          <div className={styles.tray}>
            {leading.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                label={t(item.labelKey)}
                active={isItemActive(pathname, item)}
              />
            ))}
            <div className={styles.action}>
              <ButtonLink
                href={config.actionHref}
                isIconOnly
                variant="primary"
                aria-label={t(config.actionLabelKey)}
                className={styles.actionLink}
              >
                <Icon name={config.actionIcon} size={26} />
              </ButtonLink>
            </div>
            {trailing.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                label={t(item.labelKey)}
                active={isItemActive(pathname, item)}
              />
            ))}
          </div>
        </div>
      </nav>
    </ActiveIndicatorGroup>
  );
}

function NavLink({
  item,
  label,
  active,
}: {
  item: NavItem;
  label: string;
  active: boolean;
}) {
  return (
    <ButtonLink
      href={item.href}
      scroll={false}
      variant="ghost"
      size="sm"
      aria-current={active ? "page" : undefined}
      className={styles.item}
    >
      {active ? <ActiveIndicator className="bg-surface-secondary" /> : null}
      <span className="grid place-items-center">
        <Icon name={item.icon} size={23} className="relative" />
      </span>
      <span className={styles.label}>{label}</span>
    </ButtonLink>
  );
}
