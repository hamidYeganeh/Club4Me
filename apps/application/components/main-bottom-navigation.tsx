"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@theme/icon";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { ProgressiveBlur } from "@/components/progressive-blur";
import { cn } from "@/lib/cn";

type NavLabelKey = "home" | "discover" | "profile" | "reservations";

type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: IconName;
  exact?: boolean;
};

type NavConfig = {
  items: NavItem[];
  actionLabelKey: "add";
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
    actionLabelKey: "add",
    actionHref: role === "coach" ? "/coach/classes/new" : "/discovery/search",
  };
}

const athleteNav = createRoleNav("athlete");
const coachNav = createRoleNav("coach");

function isDiscoveryDetail(pathname: string): boolean {
  return (
    /^\/discovery\/(clubs|coaches|classes|articles)\/[^/]+/.test(pathname) ||
    pathname === "/discovery/business-class"
  );
}

function isNestedProfileRoute(pathname: string): boolean {
  return /^\/(athlete|coach)\/profile\/(edit|image)/.test(pathname);
}

function getNavConfig(
  pathname: string,
  discoveryRole: "athlete" | "coach",
): NavConfig | null {
  if (isNestedProfileRoute(pathname)) {
    return null;
  }

  if (pathname.startsWith("/athlete")) {
    return athleteNav;
  }

  if (pathname.startsWith("/coach")) {
    return coachNav;
  }

  if (pathname.startsWith("/discovery") && !isDiscoveryDetail(pathname)) {
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
  const t = useTranslations("nav");
  const [lastRole, setLastRole] = useState<"athlete" | "coach">("athlete");
  const routeRole = pathname.startsWith("/coach")
    ? "coach"
    : pathname.startsWith("/athlete")
      ? "athlete"
      : null;
  if (routeRole && routeRole !== lastRole) setLastRole(routeRole);
  const config = getNavConfig(pathname, routeRole ?? lastRole);

  if (!config) {
    return null;
  }

  const leading = config.items.slice(0, 2);
  const trailing = config.items.slice(2);

  return (
    <nav
      aria-label={t("main")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl"
    >
      <div className="relative h-35">
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
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-end px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-3">
          {leading.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              label={t(item.labelKey)}
              active={isItemActive(pathname, item)}
            />
          ))}
          <div className="flex flex-1 justify-center pb-2">
            <ButtonLink
              href={config.actionHref}
              isIconOnly
              variant="primary"
              aria-label={t(config.actionLabelKey)}
              className="size-14 -translate-y-2 rounded-[1.35rem]"
            >
              <Icon name="plus-fat" size={26} />
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
      className={cn(
        "h-auto min-w-0 flex-1 flex-col gap-1.5 px-1 py-2 text-sm leading-none font-medium whitespace-nowrap no-underline",
        active ? "text-accent" : "text-foreground/80",
      )}
    >
      <Icon name={item.icon} size={28} />
      <span>{label}</span>
    </ButtonLink>
  );
}
