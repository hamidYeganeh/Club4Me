"use client";

import { useRouter } from "next/navigation";
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
  action,
}: SecondaryHeaderProps) {
  const router = useRouter();
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
                onClick={() => router.back()}
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
