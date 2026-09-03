"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@heroui/react";
import { usePublicClub } from "@api";
import type { Swiper as SwiperType } from "swiper";
import { useTranslations } from "next-intl";
import { getDiscoveryClub } from "@modules/discovery/discovery.utils";
import { DiscoveryClubsDetailActionsSection } from "@modules/discovery/sections/DiscoveryClubsDetailActionsSection";
import { DiscoveryClubsDetailBodySection } from "@modules/discovery/sections/DiscoveryClubsDetailBodySection";
import { DiscoveryClubsDetailHeroSection } from "@modules/discovery/sections/DiscoveryClubsDetailHeroSection";
import { DiscoveryClubsDetailStickyHeaderSection } from "@modules/discovery/sections/DiscoveryClubsDetailStickyHeaderSection";
import { ClubReservationsAndReviewsSection } from "@modules/discovery/sections/ClubReservationsAndReviewsSection";

import type { DiscoveryClubsDetailScreenProps } from "./DiscoveryClubsDetailScreen.types";

export function DiscoveryClubsDetailScreen({
  clubId,
}: DiscoveryClubsDetailScreenProps) {
  const previewClub = getDiscoveryClub(clubId);
  const publicClub = usePublicClub(clubId);
  const isPersistedClub = /^[a-f\d]{24}$/i.test(clubId);
  const club = publicClub.data
    ? {
        id: publicClub.data.id,
        name: publicClub.data.name,
        location: publicClub.data.location?.address ?? "",
        price: 0,
        rating: "جدید",
        duration: "—",
        distance: "—",
        about: publicClub.data.description,
        images: publicClub.data.gallery.map((item) => item.url),
        map: {
          address: publicClub.data.location?.address ?? "",
          latitude: publicClub.data.location?.latitude ?? 35.6892,
          longitude: publicClub.data.location?.longitude ?? 51.389,
        },
      }
    : previewClub;
  const t = useTranslations("discovery.clubDetail");
  const heroRef = useRef<HTMLElement>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [stickyHeaderVisible, setStickyHeaderVisible] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyHeaderVisible(!entry?.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (isPersistedClub && publicClub.isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner />
      </main>
    );
  }

  if (isPersistedClub && publicClub.isError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-center text-muted">
        {t("notFound")}
      </main>
    );
  }

  const clubStats = [
    { icon: "clock" as const, label: t("duration"), value: club.duration },
    { icon: "compass" as const, label: t("distance"), value: club.distance },
    { icon: "star-full" as const, label: t("rating"), value: club.rating },
  ];

  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <DiscoveryClubsDetailStickyHeaderSection
        visible={stickyHeaderVisible}
        name={club.name}
        favorited={favorited}
        onFavoritePress={() => setFavorited((value) => !value)}
      />

      <DiscoveryClubsDetailHeroSection
        sectionRef={heroRef}
        clubId={club.id}
        name={club.name}
        location={club.location}
        price={club.price}
        images={club.images}
        thumbsSwiper={thumbsSwiper}
        onMainSwiper={setMainSwiper}
      />

      <DiscoveryClubsDetailBodySection
        images={club.images}
        about={club.about}
        location={club.map}
        stats={clubStats}
        onThumbsSwiper={setThumbsSwiper}
        onThumbClick={(index) => {
          if (!mainSwiper || mainSwiper.destroyed) {
            return;
          }
          mainSwiper.slideTo(index);
        }}
      />

      {isPersistedClub && <ClubReservationsAndReviewsSection clubId={clubId} />}

      <DiscoveryClubsDetailActionsSection />

      <div className="h-dvh" />
    </main>
  );
}
