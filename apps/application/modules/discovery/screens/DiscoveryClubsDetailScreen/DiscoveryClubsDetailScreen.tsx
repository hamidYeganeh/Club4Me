"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import {
  tokenStore,
  trackDiscoveryClubViewed,
  useCreateReport,
  usePublicClub,
  useToggleFavorite,
} from "@api";
import { useCatalogClub } from "@api/discovery";
import type { Swiper as SwiperType } from "swiper";
import { useTranslations } from "next-intl";
import { DiscoveryClubsDetailActionsSection } from "@modules/discovery/sections/DiscoveryClubsDetailActionsSection";
import { DiscoveryClubsDetailBodySection } from "@modules/discovery/sections/DiscoveryClubsDetailBodySection";
import { DiscoveryClubsDetailHeroSection } from "@modules/discovery/sections/DiscoveryClubsDetailHeroSection";
import { DiscoveryClubsDetailStickyHeaderSection } from "@modules/discovery/sections/DiscoveryClubsDetailStickyHeaderSection";
import { ClubReservationsAndReviewsSection } from "@modules/discovery/sections/ClubReservationsAndReviewsSection";
import { ClubClassesSection } from "@modules/discovery/sections/ClubClassesSection";
import { ClubBenefitProductsSection } from "@modules/discovery/sections/ClubBenefitProductsSection";
import { iconNames, type IconName } from "@theme/icon";
import { RequestFailureState } from "@/components/request-failure-state";

import type { DiscoveryClubsDetailScreenProps } from "./DiscoveryClubsDetailScreen.types";
import type { DiscoveryFacilityItem } from "@modules/discovery/discovery.types";
import { DetailPageSkeleton } from "@/components/loading-skeletons";

const ICON_NAME_SET = new Set<string>(iconNames);

function toIconName(value?: string): IconName | undefined {
  if (!value || !ICON_NAME_SET.has(value)) {
    return undefined;
  }
  return value as IconName;
}

function toFacilityItem(input: {
  id: string;
  title?: string;
  quantity?: number;
  description?: string;
  icon?: string;
  imageUrl?: string;
}): DiscoveryFacilityItem {
  return {
    id: input.id,
    title: input.title ?? input.id,
    count: input.quantity,
    description: input.description,
    icon: toIconName(input.icon),
    backgroundImage: input.imageUrl,
  };
}

export function DiscoveryClubsDetailScreen({
  clubId,
}: DiscoveryClubsDetailScreenProps) {
  const router = useRouter();
  const catalogClub = useCatalogClub(clubId);
  const persistedId = catalogClub.data?.id ?? "";
  const publicClub = usePublicClub(persistedId);
  const favorite = useToggleFavorite("club", persistedId);
  const report = useCreateReport();
  const t = useTranslations("discovery.clubDetail");
  const [heroElement, setHeroElement] = useState<HTMLElement | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [stickyHeaderVisible, setStickyHeaderVisible] = useState(false);

  useEffect(() => {
    if (persistedId && tokenStore.get()) {
      trackDiscoveryClubViewed({ club_id: persistedId });
    }
  }, [persistedId]);

  useEffect(() => {
    const hero = heroElement;
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
  }, [heroElement]);

  const loadError = catalogClub.error ?? publicClub.error;

  if (loadError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6">
        <RequestFailureState
          error={loadError}
          className="w-full max-w-md"
          onRetry={() => {
            void catalogClub.refetch();
            if (persistedId) void publicClub.refetch();
          }}
        />
      </main>
    );
  }

  if (catalogClub.isPending || publicClub.isPending) {
    return <DetailPageSkeleton />;
  }

  const data = publicClub.data;
  const location = data?.location;
  if (!data || !location) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-center text-muted">
        {t("notFound")}
      </main>
    );
  }

  const club = {
    id: data.id,
    name: data.name,
    location: location.address,
    rating:
      data.reviewsCount > 0
        ? data.averageRating.toLocaleString("fa-IR", {
            maximumFractionDigits: 1,
          })
        : "جدید",
    about: data.description,
    amenities: data.amenities.map((item) =>
      toFacilityItem({
        id: item.amenityId,
        title: item.title,
        quantity: item.quantity,
        description: item.description,
        icon: item.icon,
        imageUrl: item.imageUrl,
      }),
    ),
    equipment: data.equipment.map((item) =>
      toFacilityItem({
        id: item.equipmentId,
        title: item.title,
        quantity: item.quantity,
        description: item.description,
        icon: item.icon,
        imageUrl: item.imageUrl,
      }),
    ),
    sports: [],
    coaches: [],
    images: data.gallery
      .filter((item) => item.mimeType.startsWith("image/"))
      .map((item) => item.url),
    map: {
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    },
  };

  const clubStats = [
    {
      icon: "clock" as const,
      label: "روزهای کاری",
      value: `${data.weeklyHours.filter((item) => !item.isClosed).length.toLocaleString("fa-IR")} روز`,
    },
    {
      icon: "compass" as const,
      label: "وضعیت",
      value: data.operationalStatus === "active" ? "فعال" : "موقتاً بسته",
    },
    { icon: "star-full" as const, label: t("rating"), value: club.rating },
  ];

  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <DiscoveryClubsDetailStickyHeaderSection
        visible={stickyHeaderVisible}
        name={club.name}
        favorited={favorite.active}
        onFavoritePress={() => {
          if (!persistedId || !tokenStore.get()) {
            router.push("/auth");
            return;
          }
          favorite.mutation.mutate();
        }}
      />

      <DiscoveryClubsDetailHeroSection
        sectionRef={setHeroElement}
        clubId={clubId}
        name={club.name}
        location={club.location}
        statusLabel={data.operationalStatus === "active" ? "فعال" : "بسته"}
        images={club.images}
        thumbsSwiper={thumbsSwiper}
        onMainSwiper={setMainSwiper}
      />

      <DiscoveryClubsDetailBodySection
        name={club.name}
        images={club.images}
        about={club.about}
        amenities={club.amenities}
        equipment={club.equipment}
        sports={club.sports}
        coaches={club.coaches}
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

      <ClubClassesSection clubId={club.id} />

      <ClubBenefitProductsSection clubId={club.id} />

      <ClubReservationsAndReviewsSection clubId={club.id} />

      <DiscoveryClubsDetailActionsSection
        primaryLabel={t("bookNow")}
        onBook={() => {
          router.push(`/discovery/clubs/${clubId}/slots`);
        }}
        onShare={() => {
          if (navigator.share) {
            void navigator.share({
              title: club.name,
              url: window.location.href,
            });
          } else {
            void navigator.clipboard?.writeText(window.location.href);
          }
        }}
        onReport={() => {
          if (!tokenStore.get()) {
            router.push("/auth");
            return;
          }
          const details = window
            .prompt("چه اطلاعاتی در این صفحه نادرست است؟")
            ?.trim();
          if (!details) return;
          report.mutate(
            {
              targetType: "club",
              targetId: club.id,
              reason: "اطلاعات نادرست",
              details,
            },
            {
              onSuccess: () => toast.success("گزارش شما ثبت شد"),
              onError: () => toast.danger("ثبت گزارش ناموفق بود"),
            },
          );
        }}
      />

      <div className="h-dvh" />
    </main>
  );
}
