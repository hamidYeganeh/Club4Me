"use client";
import { DiscoveryHeroScrim } from "@modules/discovery/components/DiscoveryImageHero";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Icon } from "@theme/icon";
import { useReducedMotion } from "motion/react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

import { Typography } from "@heroui/react";
import { getLocaleDirection } from "@/lib/locale-direction";
import { POST_WELCOME_PATH, markWelcomeSeen } from "@/lib/welcome-onboarding";

import { welcomeIntroduceCarouselSectionStyles } from "./WelcomeIntroduceCarouselSection.styles";
import type { WelcomeIntroduceCarouselSectionProps } from "./WelcomeIntroduceCarouselSection.types";

export function WelcomeIntroduceCarouselSection({
  slides,
  prevLabel,
  nextLabel,
  paginationLabel,
  slideLabels,
}: WelcomeIntroduceCarouselSectionProps) {
  const styles = welcomeIntroduceCarouselSectionStyles();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const direction = getLocaleDirection(useLocale());
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === slides.length - 1;

  function completeWelcome() {
    markWelcomeSeen();
    router.replace(POST_WELCOME_PATH);
  }

  return (
    <div className={styles.root()}>
      <div className={styles.stage()}>
        <Swiper
          dir={direction}
          slidesPerView={1}
          speed={reduceMotion ? 0 : 380}
          observer
          observeParents
          watchOverflow
          onSwiper={(instance) => {
            setSwiper(instance);
            instance.update();
          }}
          onResize={(instance) => instance.update()}
          onSlideChange={(instance) => setActiveIndex(instance.activeIndex)}
          className={styles.swiper()}
        >
          {slides.map((slide, index) => {
            const shouldMountImage = Math.abs(index - activeIndex) <= 1;

            return (
              <SwiperSlide key={slide.imageSrc} className={styles.slide()}>
                {shouldMountImage ? (
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className={styles.image()}
                  />
                ) : null}
                <div aria-hidden className={styles.overlay()} />
                <DiscoveryHeroScrim />

                <div className={styles.copy()}>
                  <Typography
                    type="h2"
                    align="center"
                    className={styles.title()}
                  >
                    {slide.title}
                  </Typography>
                  <Typography
                    type="body"
                    color="muted"
                    align="center"
                    className={styles.subtitle()}
                  >
                    {slide.subtitle}
                  </Typography>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      <div className={styles.footer()}>
        <button
          type="button"
          aria-label={nextLabel}
          className={styles.navNext()}
          onClick={() => {
            if (isLast) {
              completeWelcome();
              return;
            }
            swiper?.slideNext();
          }}
        >
          {isLast ? "شروع" : <Icon name="chevron-left" size="lg" />}
        </button>

        <div
          className={styles.pagination()}
          dir={direction}
          role="tablist"
          aria-label={paginationLabel}
        >
          {slides.map((slide, index) => {
            const active = index === activeIndex;

            return (
              <button
                key={slide.imageSrc}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={slideLabels[index]}
                className={styles.bullet()}
                onClick={() => swiper?.slideTo(index)}
              >
                <span
                  className={`${styles.bulletBar()} ${active ? styles.bulletActive() : styles.bulletInactive()}`}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={isFirst}
          aria-label={prevLabel}
          className={styles.navPrev()}
          onClick={() => {
            if (isFirst) {
              return;
            }
            swiper?.slidePrev();
          }}
        >
          <Icon name="chevron-right" size="lg" />
        </button>
      </div>
    </div>
  );
}
