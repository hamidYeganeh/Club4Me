"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import { discoveryClubsDetailBodySectionStyles } from "./DiscoveryClubsDetailBodySection.styles";
import type { DiscoveryClubsDetailBodySectionProps } from "./DiscoveryClubsDetailBodySection.types";

export function DiscoveryClubsDetailBodySection({
  images,
  about,
  stats,
  onThumbsSwiper,
  onThumbClick,
}: DiscoveryClubsDetailBodySectionProps) {
  const t = useTranslations("discovery.clubDetail");
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const aboutRef = useRef<HTMLParagraphElement>(null);
  const styles = discoveryClubsDetailBodySectionStyles({ expanded });

  useEffect(() => {
    const node = aboutRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      if (expanded) {
        return;
      }
      setCanExpand(node.scrollHeight > node.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [about, expanded]);

  return (
    <section className={styles.root()}>
      <div dir="ltr" className="w-full">
        <Swiper
          dir="ltr"
          modules={[FreeMode, Thumbs]}
          onSwiper={onThumbsSwiper}
          onClick={(swiper) => {
            if (typeof swiper.clickedIndex === "number") {
              onThumbClick(swiper.clickedIndex);
            }
          }}
          spaceBetween={12}
          slidesPerView={3}
          watchSlidesProgress
          slideToClickedSlide
          watchOverflow
          className={styles.thumbsSwiper()}
        >
          {images.map((src) => (
            <SwiperSlide key={src} className={styles.thumbSlide()}>
              <Image
                src={src}
                alt=""
                fill
                sizes="33vw"
                className={styles.image()}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className={styles.stats()}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat()}>
            <span className={styles.statIcon()}>
              <Icon name={stat.icon} size="sm" />
            </span>
            <div className={styles.statText()}>
              <p className={styles.statValue()}>{stat.value}</p>
              <p className={styles.statLabel()}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.about()}>
        <h2 className={styles.aboutTitle()}>{t("aboutTitle")}</h2>
        <p ref={aboutRef} className={styles.aboutBody()}>
          {about}
        </p>
        {(canExpand || expanded) && (
          <Button
            variant="ghost"
            size="lg"
            onPress={() => setExpanded((value) => !value)}
          >
            {expanded ? t("seeLess") : t("seeMore")}
          </Button>
        )}
      </div>
    </section>
  );
}
