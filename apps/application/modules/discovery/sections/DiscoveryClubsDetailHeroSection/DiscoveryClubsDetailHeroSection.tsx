"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NumberFlow from "@number-flow/react";
import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { Autoplay, FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import { discoveryClubsDetailHeroSectionStyles } from "./DiscoveryClubsDetailHeroSection.styles";
import type { DiscoveryClubsDetailHeroSectionProps } from "./DiscoveryClubsDetailHeroSection.types";

export function DiscoveryClubsDetailHeroSection({
  name,
  location,
  price,
  images,
  thumbsSwiper,
  onMainSwiper,
  sectionRef,
}: DiscoveryClubsDetailHeroSectionProps) {
  const t = useTranslations("discovery.clubDetail");
  const styles = discoveryClubsDetailHeroSectionStyles();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);

  return (
    <section ref={sectionRef} className={styles.root()} dir="ltr">
      <Swiper
        dir="ltr"
        modules={[Autoplay, FreeMode, Thumbs]}
        onSwiper={onMainSwiper}
        thumbs={{
          swiper:
            thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        rewind
        watchOverflow
        className={styles.mainSwiper()}
      >
        {images.map((src) => (
          <SwiperSlide key={src} className={styles.slide()}>
            <Image
              src={src}
              alt={name}
              fill
              priority
              sizes="100vw"
              className={styles.image()}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div aria-hidden className={styles.overlay()} />

      <div className={styles.topBar()} dir="rtl">
        <Button
          isIconOnly
          aria-label={t("back")}
          variant="secondary"
          size="lg"
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size="lg" />
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

      <div className={styles.metaRow()} dir="rtl">
        <div className={styles.meta()}>
          <p className={styles.location()}>{location}</p>
          <h1 className={styles.name()}>{name}</h1>
        </div>

        <NumberFlow
          value={price}
          format={{
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }}
          className={styles.price()}
        />
      </div>
    </section>
  );
}
