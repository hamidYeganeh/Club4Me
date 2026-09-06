"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Skeleton } from "@heroui/react";
import { usePublicClub } from "@api";
import { useCatalogClub } from "@api/discovery";
import { Icon } from "@theme/icon";
import { FALLBACK_IMAGE_SRC } from "@ui/fallback-image";
import type { Swiper as SwiperType } from "swiper";
import { Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FallbackImage } from "@/components/FallbackImage";

import "swiper/css";
import "swiper/css/pagination";

import type { DiscoveryClubGalleryScreenProps } from "./DiscoveryClubGalleryScreen.types";

function GallerySkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="در حال بارگذاری گالری"
      className="flex min-h-dvh flex-col overflow-hidden bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      dir="rtl"
    >
      <header className="grid h-16 shrink-0 grid-cols-[3rem_1fr_3rem] items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="mx-auto h-7 w-28 rounded-lg" />
        <Skeleton className="size-12 rounded-full" />
      </header>

      <div className="relative min-h-0 flex-1 py-3">
        <Skeleton className="h-full w-full rounded-[2rem]" />
      </div>

      <div className="mt-3 flex h-20 shrink-0 gap-2 overflow-hidden pb-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton
            key={index}
            className="aspect-square h-full shrink-0 rounded-[1.1rem]"
          />
        ))}
      </div>
    </main>
  );
}

export function DiscoveryClubGalleryScreen({
  clubId,
}: DiscoveryClubGalleryScreenProps) {
  const router = useRouter();
  const catalogClub = useCatalogClub(clubId);
  const club = usePublicClub(catalogClub.data?.id ?? "");
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);
  const [category, setCategory] = useState("");

  if (catalogClub.isPending || club.isPending) {
    return <GallerySkeleton />;
  }

  if (!club.data || catalogClub.isError || club.isError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-6 text-center text-muted">
        گالری این باشگاه در دسترس نیست.
      </main>
    );
  }

  const gallery = club.data.gallery.filter(
    (item) =>
      item.mimeType.startsWith("image/") &&
      (!category || (item.category ?? "other") === category),
  );
  const images = gallery.map((item) => item.url);
  const slides = images.length > 0 ? images : [FALLBACK_IMAGE_SRC];

  return (
    <main
      className="flex min-h-dvh flex-col overflow-hidden bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      dir="rtl"
    >
      <label className="mt-3 text-sm">
        دسته عکس
        <select
          className="ms-3 rounded-xl border border-border bg-surface p-2"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setActiveIndex(0);
            swiper?.slideTo(0);
          }}
        >
          <option value="">همه عکس‌ها</option>
          <option value="training">فضای تمرین</option>
          <option value="equipment">تجهیزات</option>
          <option value="changing_room">رختکن</option>
          <option value="entrance">نمای ورودی</option>
          <option value="other">سایر</option>
        </select>
      </label>
      {gallery[activeIndex]?.takenOn && (
        <p className="mt-2 text-xs text-muted">
          تاریخ عکس (اعلام باشگاه):{" "}
          {new Date(
            `${gallery[activeIndex]!.takenOn}T12:00:00`,
          ).toLocaleDateString("fa-IR")}
        </p>
      )}
      {!images.length && (
        <p className="mt-3 text-sm text-muted">
          عکسی در این دسته ثبت نشده است.
        </p>
      )}
      <header className="grid h-16 shrink-0 grid-cols-[3rem_1fr_3rem] items-center gap-3">
        <Button
          isIconOnly
          variant="ghost"
          size="lg"
          aria-label="بازگشت"
          onPress={() => router.back()}
        >
          <Icon name="chevron-right" size="xl" />
        </Button>
        <h1 className="text-center text-xl font-black tracking-tight text-foreground">
          گالری ({images.length.toLocaleString("fa-IR")})
        </h1>
        <Button
          isIconOnly
          variant={gridVisible ? "primary" : "ghost"}
          size="lg"
          aria-label={gridVisible ? "نمایش اسلایدی" : "نمایش شبکه‌ای"}
          onPress={() => setGridVisible((value) => !value)}
        >
          <Icon name="grid-four" size="xl" />
        </Button>
      </header>

      {gridVisible ? (
        <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto py-3">
          {slides.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-surface-secondary outline-none ring-accent transition data-[active=true]:ring-2"
              data-active={index === activeIndex}
              onClick={() => {
                setActiveIndex(index);
                setGridVisible(false);
              }}
            >
              <FallbackImage
                src={src}
                alt={`${club.data.name} - ${index + 1}`}
                fill
                unoptimized
                sizes="50vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="relative min-h-0 flex-1 py-3">
            <Swiper
              dir="rtl"
              modules={[Keyboard, Pagination]}
              keyboard={{ enabled: true }}
              pagination={{ clickable: true }}
              rewind
              initialSlide={activeIndex}
              onSwiper={(instance) => {
                setSwiper(instance);
                instance.slideTo(activeIndex, 0);
              }}
              onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
              className="h-full overflow-hidden rounded-[2rem] border border-border bg-surface-secondary [&_.swiper-pagination-bullet]:bg-white/80 [&_.swiper-pagination-bullet-active]:w-7 [&_.swiper-pagination-bullet-active]:rounded-full [&_.swiper-pagination-bullet-active]:bg-accent"
            >
              {slides.map((src, index) => (
                <SwiperSlide
                  key={`${src}-${index}`}
                  className="relative h-full"
                >
                  <FallbackImage
                    src={src}
                    alt={`${club.data.name} - ${index + 1}`}
                    fill
                    unoptimized
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {slides.length > 1 && (
              <div
                className="pointer-events-none absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 justify-between"
                dir="ltr"
              >
                <Button
                  isIconOnly
                  className="pointer-events-auto size-12 rounded-full bg-foreground text-background shadow-lg"
                  aria-label="تصویر قبلی"
                  onPress={() => swiper?.slidePrev()}
                >
                  <Icon name="chevron-left" size="lg" />
                </Button>
                <Button
                  isIconOnly
                  className="pointer-events-auto size-12 rounded-full bg-foreground text-background shadow-lg"
                  aria-label="تصویر بعدی"
                  onPress={() => swiper?.slideNext()}
                >
                  <Icon name="chevron-right" size="lg" />
                </Button>
              </div>
            )}
          </div>

          <div
            className="mt-3 flex h-20 shrink-0 gap-2 overflow-x-auto pb-1"
            dir="rtl"
          >
            {slides.map((src, index) => (
              <button
                key={`${src}-thumb-${index}`}
                type="button"
                aria-label={`نمایش تصویر ${index + 1}`}
                data-active={index === activeIndex}
                className="relative aspect-square h-full shrink-0 overflow-hidden rounded-[1.1rem] border-2 border-border bg-surface-secondary outline-none transition data-[active=true]:border-accent"
                onClick={() => swiper?.slideTo(index)}
              >
                <FallbackImage
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
