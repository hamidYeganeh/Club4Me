"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { getLocaleDirection } from "@/lib/locale-direction";
import { useClubs } from "@api/discovery";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { Icon } from "@theme/icon";
import { DISCOVERY_CLUBS } from "@modules/discovery/discovery.constants";
import type { DiscoveryClub } from "@modules/discovery/discovery.types";
import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";

import { discoveryHomeDealsSectionStyles } from "./DiscoveryHomeDealsSection.styles";
import type { DiscoveryHomeDealsSectionProps } from "./DiscoveryHomeDealsSection.types";

import "swiper/css";
import "swiper/css/free-mode";

const INITIAL_SECONDS = 3 * 60 * 60 + 2 * 60 + 38;
const MAX_VISIBLE_CLUBS = 6;

function formatTime(seconds: number): string[] {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds].map((value) =>
    value.toLocaleString("fa-IR", {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }),
  );
}

function formatPrice(price: number): string {
  return price.toLocaleString("fa-IR");
}

function toDisplayClub(
  club: { id: string; name: string; city?: string },
  index: number,
) {
  const fallback = DISCOVERY_CLUBS[index % DISCOVERY_CLUBS.length]!;

  return {
    ...fallback,
    id: club.id,
    name: club.name,
    location: club.city ?? fallback.location,
  };
}

export function DiscoveryHomeDealsSection({
  clubs = DISCOVERY_CLUBS,
}: DiscoveryHomeDealsSectionProps) {
  const styles = discoveryHomeDealsSectionStyles();
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());
  const { active } = useActiveLocation();
  const nearby = useClubs(getActiveCoordinates(active));
  const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_SECONDS);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    const endsAt = Date.now() + INITIAL_SECONDS * 1000;
    const updateRemainingSeconds = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };

    updateRemainingSeconds();
    const intervalId = window.setInterval(updateRemainingSeconds, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const availableClubs = useMemo<DiscoveryClub[]>(() => {
    if (!nearby.data) {
      return clubs;
    }

    return nearby.data.items.map(toDisplayClub);
  }, [clubs, nearby.data]);

  const locations = useMemo(
    () =>
      [
        ...new Set(availableClubs.map((club) => club.location).filter(Boolean)),
      ].slice(0, 5),
    [availableClubs],
  );
  const displayedClubs = availableClubs
    .filter((club) => !selectedLocation || club.location === selectedLocation)
    .slice(0, MAX_VISIBLE_CLUBS);
  const timeParts = formatTime(remainingSeconds);

  return (
    <section className={styles.root()} aria-labelledby="discovery-deals-title">
      <div aria-hidden className={styles.pattern()} />

      <div className={styles.header()}>
        <DiscoverySectionHeader
          id="discovery-deals-title"
          title={t("dealsTitle")}
          subtitle={t("dealsSubtitle")}
          accent
          className={styles.copy()}
        />
        <div
          className={styles.timer()}
          dir="ltr"
          aria-label={t("dealsTimerLabel")}
        >
          {timeParts.map((part, index) => (
            <span key={`${part}-${index}`} className="contents">
              {index > 0 ? <span className={styles.separator()}>:</span> : null}
              <span className={styles.timeBox()}>{part}</span>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.filters()} aria-label={t("dealsFilterLabel")}>
        <button
          type="button"
          className={`${styles.filter()} ${
            selectedLocation === null
              ? styles.filterActive()
              : styles.filterInactive()
          }`}
          onClick={() => setSelectedLocation(null)}
        >
          {t("allCities")}
        </button>
        {locations.map((location) => (
          <button
            key={location}
            type="button"
            className={`${styles.filter()} ${
              selectedLocation === location
                ? styles.filterActive()
                : styles.filterInactive()
            }`}
            onClick={() => setSelectedLocation(location)}
          >
            {location}
          </button>
        ))}
      </div>

      {displayedClubs.length > 0 ? (
        <div dir={direction} className={styles.carouselWrap()}>
          <Swiper
            dir={direction}
            modules={[FreeMode]}
            freeMode
            slidesPerView="auto"
            spaceBetween={12}
            watchOverflow
            className={styles.carousel()}
          >
            {displayedClubs.map((club) => {
              const originalPrice = Math.round(club.price / 0.8);

              return (
                <SwiperSlide key={club.id} className={styles.slide()}>
                  <Link
                    href={`/discovery/clubs/${club.id}`}
                    scroll={false}
                    className={`group ${styles.card()}`}
                    aria-label={club.name}
                  >
                    <div className={styles.imageWrap()}>
                      <Image
                        src={club.images[0]!}
                        alt={club.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 78vw, 288px"
                        className={styles.image()}
                      />
                      <div aria-hidden className={styles.imageOverlay()} />
                      <span className={styles.qualityBadge()}>
                        <Icon
                          name="star-full"
                          size={12}
                          className="text-[#d89500]"
                        />
                        {t("premium")}
                      </span>
                      <div className={styles.price()}>
                        <span className={styles.discount()}>
                          {t("discount", { percent: 20 })}
                        </span>
                        <p className={styles.previous()}>
                          {formatPrice(originalPrice)} تومان
                        </p>
                        <p className={styles.current()}>
                          {t("fromPrice", { price: formatPrice(club.price) })}
                        </p>
                      </div>
                    </div>
                    <h3 className={styles.name()}>{club.name}</h3>
                    <p className={styles.meta()}>
                      {club.location}
                      <span aria-hidden>·</span>
                      {club.distance}
                      <span
                        className={`inline-flex items-center gap-0.5 ${styles.star()}`}
                      >
                        <Icon name="star-full" size={12} />
                        {club.rating}
                      </span>
                    </p>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      ) : (
        <p className={styles.empty()}>{t("dealsEmpty")}</p>
      )}
    </section>
  );
}
