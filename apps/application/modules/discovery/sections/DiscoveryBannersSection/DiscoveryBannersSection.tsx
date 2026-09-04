"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";
import { Autoplay, FreeMode, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { FallbackImage } from "@/components/FallbackImage";
import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";

import { discoveryBannersSectionStyles } from "./DiscoveryBannersSection.styles";
import type { DiscoveryBannersSectionProps } from "./DiscoveryBannersSection.types";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

export function DiscoveryBannersSection({
  id,
  title,
  subtitle,
  viewAllLabel,
  viewAllUrl,
  items,
  aspectRatio = "16/9",
  slidesPerView = 1.2,
  spaceBetween = 12,
  autoplay = true,
  className,
}: DiscoveryBannersSectionProps) {
  const direction = getLocaleDirection(useLocale());
  const reduceMotion = useReducedMotion();
  const isAuto = slidesPerView === "auto";
  const isSingle = slidesPerView === 1;
  const styles = discoveryBannersSectionStyles({
    aspectRatio,
    slidesPerView: isAuto ? "auto" : isSingle ? "1" : "1.2",
    cardWidth: isAuto ? aspectRatio : "none",
  });
  const titleId = id ? `discovery-banners-${id}` : undefined;

  if (items.length === 0) {
    return null;
  }

  const modules = [
    ...(isAuto ? [FreeMode] : []),
    ...(isSingle ? [Pagination] : []),
    ...(autoplay && !reduceMotion ? [Autoplay] : []),
  ];

  return (
    <section
      className={styles.root({ className })}
      aria-labelledby={titleId}
      aria-label={titleId ? undefined : title ?? "بنرها"}
    >
      {title ? (
        <DiscoverySectionHeader
          id={titleId}
          title={title}
          subtitle={subtitle}
          viewAllLabel={viewAllLabel}
          viewAllUrl={viewAllUrl}
        />
      ) : null}

      <Swiper
        dir={direction}
        modules={modules}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        freeMode={isAuto}
        watchOverflow
        loop={!isAuto && items.length > 1}
        pagination={isSingle ? { clickable: true } : undefined}
        autoplay={
          autoplay && !reduceMotion
            ? {
                delay: 4200,
                disableOnInteraction: false,
              }
            : false
        }
        className={styles.swiper()}
      >
        {items.map((item, index) => {
          const key = item.id ?? `${item.imageUrl}-${index}`;
          const card = (
            <>
              <FallbackImage
                src={item.imageUrl}
                alt={item.title}
                fill
                unoptimized
                priority={index === 0}
                sizes={
                  isAuto
                    ? "(max-width: 640px) 60vw, 240px"
                    : isSingle
                      ? "100vw"
                      : "85vw"
                }
                className={styles.image()}
              />
              <div aria-hidden className={styles.overlay()} />
              <div className={styles.content()}>
                <strong className={styles.title()}>{item.title}</strong>
                {item.subtitle ? (
                  <span className={styles.subtitle()}>{item.subtitle}</span>
                ) : null}
                {item.actionLabel ? (
                  <span className={styles.action()}>{item.actionLabel}</span>
                ) : null}
              </div>
            </>
          );

          return (
            <SwiperSlide key={key} className={styles.slide()}>
              {item.actionUrl ? (
                <Link
                  href={item.actionUrl}
                  scroll={false}
                  className={styles.card()}
                  aria-label={item.title}
                >
                  {card}
                </Link>
              ) : (
                <div className={styles.card()}>{card}</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
