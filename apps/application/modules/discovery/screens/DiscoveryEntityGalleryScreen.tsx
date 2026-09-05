"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Skeleton } from "@heroui/react";
import { useCatalogClass, useCatalogCoach } from "@api/discovery";
import { Icon } from "@theme/icon";
import { FALLBACK_IMAGE_SRC } from "@ui/fallback-image";
import type { Swiper as SwiperType } from "swiper";
import { Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FallbackImage } from "@/components/FallbackImage";

import "swiper/css";
import "swiper/css/pagination";

export function DiscoveryEntityGalleryScreen({ type, id }: { type: "coach" | "class"; id: string }) {
  const router = useRouter();
  const coach = useCatalogCoach(type === "coach" ? id : "");
  const classItem = useCatalogClass(type === "class" ? id : "");
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);
  const pending = type === "coach" ? coach.isPending : classItem.isPending;
  const name = type === "coach" ? coach.data?.displayName : classItem.data?.title;
  const images = type === "coach"
    ? (coach.data?.portfolio.map((image) => image.url) ?? [])
    : (classItem.data?.imageUrl ? [classItem.data.imageUrl] : []);
  const slides = images.length ? images : [FALLBACK_IMAGE_SRC];

  if (pending) return <main className="flex min-h-dvh flex-col gap-4 bg-background p-4"><Skeleton className="h-14 rounded-2xl" /><Skeleton className="min-h-0 flex-1 rounded-[2rem]" /></main>;
  if (!name) return <main className="grid min-h-dvh place-items-center bg-background p-6 text-muted">گالری در دسترس نیست.</main>;

  return (
    <main className="flex min-h-dvh flex-col overflow-hidden bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]" dir="rtl">
      <header className="grid h-16 shrink-0 grid-cols-[3rem_1fr_3rem] items-center gap-3">
        <Button isIconOnly variant="ghost" size="lg" aria-label="بازگشت" onPress={() => router.back()}><Icon name="chevron-right" size="xl" /></Button>
        <h1 className="truncate text-center text-xl font-black text-foreground">گالری {name}</h1>
        <Button isIconOnly variant={gridVisible ? "primary" : "ghost"} size="lg" aria-label="تغییر نمای گالری" onPress={() => setGridVisible((value) => !value)}><Icon name="grid-four" size="xl" /></Button>
      </header>
      {gridVisible ? (
        <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto py-3">
          {slides.map((src, index) => <button key={`${src}-${index}`} type="button" className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-surface-secondary ring-accent data-[active=true]:ring-2" data-active={index === activeIndex} onClick={() => { setActiveIndex(index); setGridVisible(false); }}><FallbackImage src={src} alt={`${name} ${index + 1}`} fill unoptimized sizes="50vw" className="object-cover" /></button>)}
        </div>
      ) : (
        <>
          <div className="relative min-h-0 flex-1 py-3">
            <Swiper dir="rtl" modules={[Keyboard, Pagination]} keyboard={{ enabled: true }} pagination={{ clickable: true }} rewind initialSlide={activeIndex} onSwiper={(instance) => { setSwiper(instance); instance.slideTo(activeIndex, 0); }} onSlideChange={(instance) => setActiveIndex(instance.realIndex)} className="h-full overflow-hidden rounded-[2rem] border border-border bg-surface-secondary [&_.swiper-pagination-bullet]:bg-foreground/55 [&_.swiper-pagination-bullet-active]:w-7 [&_.swiper-pagination-bullet-active]:rounded-full [&_.swiper-pagination-bullet-active]:bg-accent">
              {slides.map((src, index) => <SwiperSlide key={`${src}-${index}`} className="relative h-full"><FallbackImage src={src} alt={`${name} ${index + 1}`} fill unoptimized priority={index === 0} sizes="100vw" className="object-cover" /></SwiperSlide>)}
            </Swiper>
            {slides.length > 1 ? <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 justify-between" dir="ltr"><Button isIconOnly className="pointer-events-auto rounded-full bg-foreground text-background" aria-label="قبلی" onPress={() => swiper?.slidePrev()}><Icon name="chevron-left" /></Button><Button isIconOnly className="pointer-events-auto rounded-full bg-foreground text-background" aria-label="بعدی" onPress={() => swiper?.slideNext()}><Icon name="chevron-right" /></Button></div> : null}
          </div>
          <div className="mt-3 flex h-20 shrink-0 gap-2 overflow-x-auto pb-1">
            {slides.map((src, index) => <button key={`${src}-thumb-${index}`} type="button" aria-label={`تصویر ${index + 1}`} data-active={index === activeIndex} className="relative aspect-square h-full shrink-0 overflow-hidden rounded-[1.1rem] border-2 border-border data-[active=true]:border-accent" onClick={() => swiper?.slideTo(index)}><FallbackImage src={src} alt="" fill unoptimized sizes="80px" className="object-cover" /></button>)}
          </div>
        </>
      )}
    </main>
  );
}
