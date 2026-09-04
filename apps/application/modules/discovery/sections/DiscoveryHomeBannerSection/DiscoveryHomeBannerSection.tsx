"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { getLocaleDirection } from "@/lib/locale-direction";
import { DISCOVERY_CLUBS } from "@modules/discovery/discovery.constants";

import { discoveryHomeBannerSectionStyles } from "./DiscoveryHomeBannerSection.styles";

import "swiper/css";
import "swiper/css/pagination";

const BANNER_IMAGES = DISCOVERY_CLUBS.slice(0, 4)
  .map((club) => club.images[0])
  .filter((image): image is string => Boolean(image));

export function DiscoveryHomeBannerSection() {
  const styles = discoveryHomeBannerSectionStyles();
  const reduceMotion = useReducedMotion();
  const direction = getLocaleDirection(useLocale());

  if (BANNER_IMAGES.length === 0) {
    return null;
  }

  return (
    <section className={styles.root()} aria-label="بنر باشگاه‌های منتخب">
      <Swiper
        dir={direction}
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={BANNER_IMAGES.length > 1}
        watchOverflow
        pagination={{ clickable: true }}
        autoplay={
          reduceMotion
            ? false
            : {
                delay: 4200,
                disableOnInteraction: false,
              }
        }
        className={styles.swiper()}
      >
        {BANNER_IMAGES.map((src, index) => (
          <SwiperSlide key={`${src}-${index}`} className={styles.slide()}>
            <Image
              src={src}
              alt="بنر باشگاه"
              fill
              priority={index === 0}
              unoptimized
              sizes="100vw"
              className={styles.image()}
            />
            <div aria-hidden className={styles.overlay()} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
