"use client";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { useTranslations } from "next-intl";
import { DiscoveryClubsDetailActionsSection } from "@modules/discovery/sections/DiscoveryClubsDetailActionsSection";
import { DiscoveryClubsDetailBodySection } from "@modules/discovery/sections/DiscoveryClubsDetailBodySection";
import { DiscoveryClubsDetailHeroSection } from "@modules/discovery/sections/DiscoveryClubsDetailHeroSection";
import { DiscoveryClubsDetailStickyHeaderSection } from "@modules/discovery/sections/DiscoveryClubsDetailStickyHeaderSection";

import type { DiscoveryClubsDetailScreenProps } from "./DiscoveryClubsDetailScreen.types";

const CLUB_IMAGES = [
  "/mock/clubs/01.jpg",
  "/mock/clubs/02.jpg",
  "/mock/clubs/03.jpg",
  "/mock/clubs/04.jpg",
  "/mock/clubs/05.jpg",
  "/mock/clubs/06.jpg",
];

const CLUB_NAME = "جزیره بالی";

const CLUB_ABOUT =
  "باشگاه بالی جزیره‌ای گرمسیری با ساحل‌های چشم‌نواز، شالیزارهای سرسبز و فرهنگی زنده است. معابد باستانی را بگردید، روی موج‌های جهانی موج‌سواری کنید و از مهمان‌نوازی گرم مردم جزیره لذت ببرید. این مقصد ترکیبی از آرامش طبیعت و هیجان ماجراجویی را در یک سفر به‌یادماندنی کنار هم می‌آورد.";

export function DiscoveryClubsDetailScreen({
  clubId: _clubId,
}: DiscoveryClubsDetailScreenProps) {
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

  const clubStats = [
    { icon: "clock" as const, label: t("duration"), value: "۱۵-۱۸ ساعت" },
    { icon: "compass" as const, label: t("distance"), value: "۱۲۵ کیلومتر" },
    { icon: "star-full" as const, label: t("rating"), value: "۴.۸" },
  ];

  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <DiscoveryClubsDetailStickyHeaderSection
        visible={stickyHeaderVisible}
        name={CLUB_NAME}
        favorited={favorited}
        onFavoritePress={() => setFavorited((value) => !value)}
      />

      <DiscoveryClubsDetailHeroSection
        sectionRef={heroRef}
        name={CLUB_NAME}
        location="اندونزی"
        price={999}
        images={CLUB_IMAGES}
        thumbsSwiper={thumbsSwiper}
        onMainSwiper={setMainSwiper}
      />

      <DiscoveryClubsDetailBodySection
        images={CLUB_IMAGES}
        about={CLUB_ABOUT}
        stats={clubStats}
        onThumbsSwiper={setThumbsSwiper}
        onThumbClick={(index) => {
          if (!mainSwiper || mainSwiper.destroyed) {
            return;
          }
          mainSwiper.slideTo(index);
        }}
      />

      <DiscoveryClubsDetailActionsSection />

      <div className="h-dvh" />
    </main>
  );
}
