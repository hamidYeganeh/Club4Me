"use client";

import { DiscoverySectionHeader } from "../DiscoverySectionHeader";
import { discoveryIranMapSectionStyles } from "../../sections/DiscoveryIranMapSection/DiscoveryIranMapSection.styles";
import { IRAN_MAP_VIEWBOX, IRAN_PROVINCES } from "../../data/iran-provinces";
import { SkeletonText } from "./primitives";

export function DiscoveryIranMapSkeleton() {
  const styles = discoveryIranMapSectionStyles();
  return (
    <section
      className={styles.root({ className: "discovery-section-skeleton" })}
      data-skeleton-section="iran-map"
      inert
      aria-hidden
    >
      <div className={styles.header()}>
        <DiscoverySectionHeader
          isLoading
          title="ورزش در سراسر ایران"
          subtitle="استان را روی نقشه انتخاب کن و باشگاه‌های آن منطقه را ببین"
          icon="map-trifold"
          viewAllLabel="همه شهرها"
          viewAllUrl="/discovery/cities"
        />
      </div>
      <div className={styles.card()}>
        <div className={styles.content()}>
          <div className={styles.mapWrap()}>
            <svg viewBox={IRAN_MAP_VIEWBOX} className={styles.map()}>
              {IRAN_PROVINCES.map((province) => (
                <path
                  key={province.id}
                  d={province.path}
                  className="discovery-skeleton-province stroke-background/80"
                  strokeWidth={province.id === "IR-07" ? 2.4 : 1.15}
                />
              ))}
            </svg>
          </div>
          <div className={styles.detail()}>
            <div className={styles.detailCopy()}>
              <p className={styles.detailLabel()}>
                <SkeletonText>استان انتخاب‌شده</SkeletonText>
              </p>
              <h3 className={styles.detailTitle()}>
                <SkeletonText>تهران</SkeletonText>
              </h3>
              <p className={styles.detailValue()}>
                <SkeletonText>۱۲ باشگاه ثبت‌شده</SkeletonText>
              </p>
            </div>
            <span className={styles.action()}>
              <SkeletonText>مشاهده استان</SkeletonText>
              <span className="size-4" />
            </span>
          </div>
        </div>
        <div className={styles.source()}>
          <SkeletonText>مرزهای ۳۱ استان ایران</SkeletonText>
          <SkeletonText>© مشارکت‌کنندگان OpenStreetMap</SkeletonText>
        </div>
      </div>
    </section>
  );
}
