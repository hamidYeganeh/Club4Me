"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { NeshanMap } from "@/components/maps/neshan-map";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import { discoveryClubsDetailBodySectionStyles } from "./DiscoveryClubsDetailBodySection.styles";
import type { DiscoveryClubsDetailBodySectionProps } from "./DiscoveryClubsDetailBodySection.types";

export function DiscoveryClubsDetailBodySection({
  images,
  about,
  location,
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
                unoptimized
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
              <Typography type="body-sm" weight="semibold" truncate className={styles.statValue()}>{stat.value}</Typography>
              <Typography type="body-xs" color="muted" truncate className={styles.statLabel()}>{stat.label}</Typography>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.about()}>
        <Typography type="h5" className={styles.aboutTitle()}>{t("aboutTitle")}</Typography>
        <Typography type="body-sm" color="muted" render={({ children, ...p }) => <p ref={aboutRef} {...p}>{children}</p>} className={styles.aboutBody()}>
          {about}
        </Typography>
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

      <div className={styles.location()}>
        <div className={styles.locationHeader()}>
          <div>
            <Typography type="h5" className={styles.locationTitle()}>{t("locationTitle")}</Typography>
            <Typography type="body-sm" color="muted" className={styles.locationAddress()}>{location.address}</Typography>
          </div>
          <a
            href={`https://nshn.ir/?lat=${location.latitude}&lng=${location.longitude}`}
            target="_blank"
            rel="noreferrer"
            className={styles.locationLink()}
          >
            {t("openInNeshan")}
          </a>
        </div>
        <NeshanMap
          center={location}
          marker={location}
          markerLabel={location.address}
        />
      </div>
    </section>
  );
}
