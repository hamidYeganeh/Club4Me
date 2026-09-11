"use client";

import { RelatedClubs } from "../../components/RelatedContent";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenStore, trackDiscoveryClubViewed, usePublicClub } from "@api";
import { useCatalogClub } from "@api/discovery";
import type { Swiper as SwiperType } from "swiper";
import { useTranslations } from "next-intl";
import { DiscoveryClubsDetailActionsSection } from "@modules/discovery/sections/DiscoveryClubsDetailActionsSection";
import { DiscoveryClubsDetailBodySection } from "@modules/discovery/sections/DiscoveryClubsDetailBodySection";
import { DiscoveryClubsDetailHeroSection } from "@modules/discovery/sections/DiscoveryClubsDetailHeroSection";
import { ClubReservationsAndReviewsSection } from "@modules/discovery/sections/ClubReservationsAndReviewsSection";
import { ClubSlotsSection } from "@modules/discovery/sections/ClubSlotsSection";
import { ClubProfileSection } from "@modules/discovery/sections/ClubProfileSection";
import { ClubCoachesContextSection } from "@modules/discovery/sections/ClubCoachesContextSection";
import { ClubSportsSection } from "@modules/discovery/sections/ClubSportsSection";
import { ClubClassesSection } from "@modules/discovery/sections/ClubClassesSection";
import { ClubBenefitProductsSection } from "@modules/discovery/sections/ClubBenefitProductsSection";
import { iconNames, type IconName } from "@theme/icon";
import { RequestFailureState } from "@/components/request-failure-state";
import { DetailSocialSection } from "@modules/discovery/components/DetailSocialSection";
import { DetailFaqSection } from "@modules/discovery/components/DetailFaqSection";
import { DetailGallerySection } from "@modules/discovery/components/DetailGallerySection";
import { ReportBottomSheet } from "@modules/reports/components/ReportBottomSheet";

import type { DiscoveryClubsDetailScreenProps } from "./DiscoveryClubsDetailScreen.types";
import type { DiscoveryFacilityItem } from "@modules/discovery/discovery.types";
import { DetailPageSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";

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
    icon: toIconName(input.icon) ?? "weight",
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
  const t = useTranslations("discovery.clubDetail");
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  useEffect(() => {
    if (persistedId && tokenStore.get()) {
      trackDiscoveryClubViewed({ club_id: persistedId });
    }
  }, [persistedId]);

  const loadError =
    (!catalogClub.data
      ? getQueryFailure(catalogClub.error, catalogClub.fetchStatus)
      : null) ??
    (!publicClub.data
      ? getQueryFailure(publicClub.error, publicClub.fetchStatus)
      : null);

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
  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-center text-muted">
        {t("notFound")}
      </main>
    );
  }

  const club = {
    id: data.id,
    name: data.name,
    location: location?.address ?? "نشانی ثبت نشده",
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
        description: [
          item.availability === "paid"
            ? `با هزینه جدا${item.price ? `: ${item.price.amount.toLocaleString("fa-IR")} ${item.price.currency}` : ""}`
            : item.availability === "unavailable"
              ? "فعلاً غیرفعال"
              : "داخل شهریه",
          item.description,
        ]
          .filter(Boolean)
          .join(" · "),
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
    map: location
      ? {
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        }
      : null,
  };

  const clubStats = [
    {
      icon: "clock" as const,
      label: "روزهای کاری",
      description: "ساعت هر روز و شرایط مراجعه در بخش ساعت کاری آمده است.",
      value: `${data.weeklyHours.filter((item) => !item.isClosed).length.toLocaleString("fa-IR")} روز`,
    },
    {
      icon: "compass" as const,
      label: "وضعیت",
      description:
        data.operationalStatus === "active"
          ? "باشگاه فعال است؛ ظرفیت سانس‌ها را پیش از مراجعه بررسی کن."
          : "باشگاه موقتاً بسته است؛ پیش از مراجعه تماس بگیر.",
      value: data.operationalStatus === "active" ? "فعال" : "موقتاً بسته",
    },
    {
      icon: "star-full" as const,
      label: t("rating"),
      value: club.rating,
      description: `${data.reviewsCount.toLocaleString("fa-IR")} نظر ثبت‌شده توسط کاربران`,
    },
  ];

  return (
    <main className="club-detail relative flex min-h-dvh w-full max-w-full shrink-0 flex-col overflow-x-clip [&>*]:shrink-0 bg-background pb-[calc(14rem+env(safe-area-inset-bottom))]">
      <DiscoveryClubsDetailHeroSection
        favoriteId={persistedId}
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

      <div className="px-4 pb-8">
        <DetailGallerySection
          showEmpty
          images={club.images}
          viewAllHref={`/discovery/clubs/${clubId}/gallery`}
        />
      </div>

      <ClubSportsSection sportIds={data.sportIds} />
      <ClubProfileSection club={data} />

      <ClubSlotsSection club={data} />

      <ClubClassesSection clubId={club.id} />
      <ClubCoachesContextSection
        clubId={club.id}
        timezone={location?.timezone ?? "Asia/Tehran"}
      />

      <ClubBenefitProductsSection clubId={club.id} />

      <section className="px-4">
        <DetailSocialSection items={data.socialMedia} />
        <DetailFaqSection showEmpty items={data.faqs} />
      </section>

      <ClubReservationsAndReviewsSection clubId={club.id} />
      <div className="px-5 py-8">
        <RelatedClubs
          excludeId={club.id}
          params={{ sportId: data.sportIds[0] }}
        />
      </div>

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
          setReportSheetOpen(true);
        }}
      />

      <ReportBottomSheet
        open={reportSheetOpen}
        onOpenChange={setReportSheetOpen}
        targetType="club"
        targetId={club.id}
      />
    </main>
  );
}
