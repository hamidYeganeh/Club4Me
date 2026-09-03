"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";
import { useTranslations } from "next-intl";

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
};

const athleteNav: NavConfig = {
  items: [
    { href: "/athlete", labelKey: "home", icon: "house-1", exact: true },
    { href: "/discovery", labelKey: "discover", icon: "compass" },
    {
      href: "/athlete/reservations",
      labelKey: "reservations",
      icon: "calendar-1",
    },
    { href: "/athlete/profile", labelKey: "profile", icon: "user" },
  ],
  actionLabelKey: "add",
};

function isDiscoveryClubDetail(pathname: string): boolean {
  return /^\/discovery\/clubs\/[^/]+/.test(pathname);
}

function getNavConfig(pathname: string): NavConfig | null {
  if (pathname.startsWith("/athlete")) {
    return athleteNav;
  }

  if (pathname.startsWith("/discovery") && !isDiscoveryClubDetail(pathname)) {
    return athleteNav;
  }

  return null;
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function MainBottomNavigation() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const config = getNavConfig(pathname);

  if (!config) {
    return null;
  }

  const leading = config.items.slice(0, 2);
  const trailing = config.items.slice(2);

  return (
    <nav
      aria-label={t("main")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
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
            <Button
              isIconOnly
              variant="primary"
              aria-label={t(config.actionLabelKey)}
              className="size-14 -translate-y-2 shadow-[0_8px_28px_color-mix(in_oklch,var(--accent)_42%,transparent)]"
              style={{ borderRadius: "1.35rem" }}
            >
              <Icon name="plus-fat" size={26} />
            </Button>
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
    <Button
      variant="ghost"
      size="sm"
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-auto min-w-0 flex-1 flex-col gap-1.5 px-1 py-2 text-sm leading-none font-medium whitespace-nowrap no-underline",
        active ? "text-accent" : "text-foreground/80",
      )}
      render={(props) => {
        const { type: _type, ...rest } = props;
        return <Link {...rest} href={item.href} />;
      }}
    >
      <Icon name={item.icon} size={28} />
      <span>{label}</span>
    </Button>
  );
}
