"use client";

import Link from "next/link";
import { ScrollShadow, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";

import { FallbackImage } from "@/components/FallbackImage";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import {
  mockDiscoveryClasses,
  type DiscoveryClassItem,
} from "@modules/discovery/discovery-classes.mock";

import { discoveryClassesRailSectionStyles } from "./DiscoveryClassesRailSection.styles";
import type { DiscoveryClassesRailSectionProps } from "./DiscoveryClassesRailSection.types";

const DEFAULT_LIMIT = 6;

export function DiscoveryClassesRailSection({
  id,
  title,
  subtitle,
  icon = "academic-cap",
  seeAllHref = "/discovery/classes",
  seeAllLabel,
  items,
  className,
}: DiscoveryClassesRailSectionProps) {
  const t = useTranslations("discovery.classes");
  const tHome = useTranslations("discovery.home");
  const styles = discoveryClassesRailSectionStyles();
  const visible: DiscoveryClassItem[] =
    items ?? mockDiscoveryClasses(0, DEFAULT_LIMIT);
  const titleId = `discovery-classes-rail-${id}`;

  if (visible.length === 0) {
    return null;
  }

  return (
    <section
      className={`${styles.root()} ${className ?? ""}`}
      aria-labelledby={titleId}
    >
      <DiscoverySectionHeader
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
          {visible.map((item) => {
            const remaining = Math.max(0, item.capacity - item.enrollmentCount);
            const modeLabel =
              item.deliveryMode === "online"
                ? t("modeOnline")
                : item.deliveryMode === "hybrid"
                  ? t("modeHybrid")
                  : t("modeInPerson");

            return (
              <Link
                key={item.id}
                href={item.href}
                scroll={false}
                className={styles.card()}
                aria-label={item.title}
              >
                <div className={styles.imageWrap()}>
                  <FallbackImage
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 72vw, 264px"
                    className={styles.image()}
                  />
                  <span className={styles.badge()}>{modeLabel}</span>
                  <span className={styles.seats()}>
                    {t("seatsLeft", {
                      count: remaining.toLocaleString("fa-IR"),
                    })}
                  </span>
                </div>
                <div className={styles.body()}>
                  <Typography type="body-xs" className={styles.sport()}>
                    {item.sportLabel}
                  </Typography>
                  <h3 className={styles.name()}>{item.title}</h3>
                  <p className={styles.description()}>{item.description}</p>
                  <p className={styles.price()}>
                    {t("fromPrice", {
                      price: item.price.toLocaleString("fa-IR"),
                    })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollShadow>
    </section>
  );
}
