"use client";

import { ClassCardSkeleton } from "../../components/skeletons/ClassCardSkeleton";
import { ClassCard } from "../../components/ClassCard";
import { ScrollShadow } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCatalogClasses, type PublicCatalogClass } from "@api/discovery";

import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";

import { discoveryClassesRailSectionStyles } from "./DiscoveryClassesRailSection.styles";
import type { DiscoveryClassesRailSectionProps } from "./DiscoveryClassesRailSection.types";

export function DiscoveryClassesRailSection({
  id,
  title,
  subtitle,
  icon = "academic-cap",
  seeAllHref = "/discovery/classes",
  seeAllLabel,
  items,
  params,
  className,
  isLoading = false,
  skeletonCount = 3,
}: DiscoveryClassesRailSectionProps) {
  const t = useTranslations("discovery.classes");
  const tHome = useTranslations("discovery.home");
  const styles = discoveryClassesRailSectionStyles();
  const query = useCatalogClasses(params, items === undefined && !isLoading);
  const visible: PublicCatalogClass[] = items ?? query.data?.items ?? [];
  const titleId = `discovery-classes-rail-${id}`;

  const isPending = isLoading || (items === undefined && query.isPending);

  if (!isPending && visible.length === 0) {
    return (
      <DiscoveryEmptySection
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllLabel={seeAllLabel ?? tHome("seeAll")}
        viewAllUrl={seeAllHref}
      />
    );
  }

  return (
    <section
      className={`${styles.root()} ${className ?? ""}`}
      aria-labelledby={titleId}
    >
      <DiscoverySectionHeader
        isLoading={isPending}
        id={titleId}
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllLabel={seeAllLabel ?? tHome("seeAll")}
        viewAllUrl={seeAllHref}
      />

      <ScrollShadow
        hideScrollBar
        orientation="horizontal"
        size={48}
        className={styles.scroller()}
        aria-label={title}
      >
        <div className={styles.track()}>
          {isPending
            ? Array.from({ length: skeletonCount }, (_, index) => (
                <ClassCardSkeleton key={index} />
              ))
            : visible.map((item) => {
                const remaining = Math.max(
                  0,
                  item.capacity - item.enrollmentCount,
                );
                const modeLabel =
                  item.deliveryMode === "online"
                    ? t("modeOnline")
                    : item.deliveryMode === "hybrid"
                      ? t("modeHybrid")
                      : t("modeInPerson");

                return (
                  <ClassCard
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    imageUrl={item.imageUrl}
                    href={`/discovery/classes/${item.slug}`}
                    badge={modeLabel}
                    remaining={remaining}
                    price={item.price.amount}
                    currency={item.price.currency}
                    startAt={item.courseStartAt}
                    className="w-[min(78vw,19rem)] shrink-0 snap-start"
                  />
                );
              })}
        </div>
      </ScrollShadow>
    </section>
  );
}
