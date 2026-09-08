"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@theme/icon";
import { ActiveLocationSelector } from "@modules/locations/components/ActiveLocationSelector";

import { secondaryHeaderStyles } from "./SecondaryHeader.styles";
import type { SecondaryHeaderProps } from "./SecondaryHeader.types";

export function SecondaryHeader({
  title,
  filterLabel,
  onFilterPress,
  showFilter = true,
  showBack,
  backLabel,
  backHref,
  onBack,
  action,
}: SecondaryHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const styles = secondaryHeaderStyles();
  const isPage = Boolean(title);
  const shouldShowBack = showBack ?? isPage;
  const resolvedFilterLabel = filterLabel ?? "فیلتر";
  const resolvedBackLabel = backLabel ?? t("back");

  const filterButton = showFilter ? (
    <button
      type="button"
      aria-label={resolvedFilterLabel}
      className={isPage ? styles.filter() : styles.homeFilter()}
      onClick={() => {
        if (onFilterPress) {
          onFilterPress();
          return;
        }
        router.push("/discovery/search");
      }}
    >
      <Icon name="funnel-1" size={22} />
    </button>
  ) : null;

  return (
    <>
      <header className={styles.root()}>
        {isPage ? (
          <div className={`${styles.inner()} ${styles.pageInner()}`}>
            {shouldShowBack ? (
              <button
                type="button"
                aria-label={resolvedBackLabel}
                className={styles.back()}
                onClick={() => {
                  if (onBack) {
                    onBack();
                    return;
                  }
                  if (backHref) {
                    router.push(backHref);
                    return;
                  }
                  router.push(resolveBackHref(pathname));
                }}
              >
                <Icon name="chevron-right" size={22} />
              </button>
            ) : null}
            <h1 className={styles.title()}>{title}</h1>
            <div className={styles.trailing()}>
              {action}
              {filterButton}
            </div>
          </div>
        ) : (
          <div className={`${styles.inner()} ${styles.homeInner()}`}>
            {filterButton}
            <ActiveLocationSelector />
          </div>
        )}
      </header>
      <div aria-hidden className={styles.spacer()} />
    </>
  );
}

/** Every route has a stable parent, so back never depends on browser history. */
export function resolveBackHref(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const [root, section, id, child] = parts;

  if (root === "auth") {
    if (section === "roles" && id) return "/auth/roles";
    if (section === "roles") return "/auth";
    if (["otp", "forgot-password"].includes(section ?? "") && id)
      return `/auth/${section}`;
    return "/welcome";
  }
  if (root === "welcome") return "/welcome";

  if (root === "discovery") {
    if (section === "city" && child === "district")
      return `/discovery/city/${id}`;
    if (["clubs", "coaches", "classes", "articles"].includes(section ?? "")) {
      if (child) return `/discovery/${section}/${id}`;
      if (id) return `/discovery/${section}`;
    }
    if (["province", "city"].includes(section ?? "") && id)
      return "/discovery/cities";
    if (section === "sports" && id) return "/discovery/sports";
    if (section === "club-types" && id) return "/discovery/clubs";
    if (section === "regions" && id) return "/discovery";
    return "/discovery";
  }

  if (root === "athlete" || root === "coach") {
    const home = `/${root}`;
    if (!section) return "/discovery";
    if (section === "profile") {
      if (!id) return home;
      if (id === "locations" && child) return `${home}/profile/locations`;
      return `${home}/profile`;
    }
    if (
      ["reservations", "memberships", "packages", "support"].includes(
        section,
      ) &&
      id
    )
      return `${home}/${section}`;
    if (section === "services" || section === "classes") return home;
    if (
      [
        "settings",
        "favorites",
        "notifications",
        "benefits",
        "availability",
        "club-classes",
      ].includes(section)
    )
      return section === "settings" ? `${home}/profile` : home;
    return home;
  }

  if (root === "club-memberships") return "/athlete/memberships";
  return "/discovery";
}
