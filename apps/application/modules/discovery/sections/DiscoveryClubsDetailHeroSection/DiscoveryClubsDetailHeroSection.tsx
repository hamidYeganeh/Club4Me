"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useLocale, useTranslations } from "next-intl";
import { Autoplay, FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { getLocaleDirection } from "@/lib/locale-direction";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import { discoveryClubsDetailHeroSectionStyles } from "./DiscoveryClubsDetailHeroSection.styles";
import type { DiscoveryClubsDetailHeroSectionProps } from "./DiscoveryClubsDetailHeroSection.types";

export function DiscoveryClubsDetailHeroSection({
  clubId,
  name,
  location,
  statusLabel,
  images,
  thumbsSwiper,
  onMainSwiper,
  sectionRef,
}: DiscoveryClubsDetailHeroSectionProps) {
  const t = useTranslations("discovery.clubDetail");
  const direction = getLocaleDirection(useLocale());
  const styles = discoveryClubsDetailHeroSectionStyles();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);

  return (
    <section ref={sectionRef} className={styles.root()} dir={direction}>
      <Swiper
        dir={direction}
        modules={[Autoplay, FreeMode, Thumbs]}
        onSwiper={onMainSwiper}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        rewind
        watchOverflow
        className={styles.mainSwiper()}
      >
        {images.length === 0 ? (
          <div className="grid h-full place-items-center bg-surface-secondary text-white/75">
            <Icon name="building-1" size={44} />
          </div>
        ) : null}
        {images.map((src, index) => (
          <SwiperSlide key={src} className={styles.slide()}>
            <Image
              src={src}
              alt={name}
              fill
              unoptimized
              priority={index === 0}
              sizes="100vw"
              className={styles.image()}
              data-zoom-enter-key={index === 0 ? clubId : undefined}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div aria-hidden className={styles.overlay()} />

      <div className={styles.topBar()} dir={direction}>
        <Button
          isIconOnly
          aria-label={t("back")}
          variant="secondary"
          size="lg"
          onPress={() => router.back()}
        >
          <Icon name="chevron-right" size="lg" />
        </Button>

        <Button
          isIconOnly
          aria-label={favorited ? t("unfavorite") : t("favorite")}
          variant="secondary"
          size="lg"
          onPress={() => setFavorited((value) => !value)}
        >
          <Icon name="heart" size="lg" className={styles.favoriteIcon()} />
        </Button>
      </div>

      <div className={styles.metaRow()} dir={direction}>
        <div className={styles.meta()}>
          <Typography type="body-sm" className={styles.location()}>
            {location}
          </Typography>
          <Typography type="h2" truncate className={styles.name()}>
            {name}
          </Typography>
        </div>

        <span className={styles.price()}>{statusLabel}</span>
      </div>
    </section>
  );
}
