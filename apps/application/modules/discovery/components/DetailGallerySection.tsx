"use client";

import { useState } from "react";
import { Card } from "@heroui/react";
import { useLocale } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { FallbackImage } from "@/components/FallbackImage";
import { getLocaleDirection } from "@/lib/locale-direction";
import { ButtonLink } from "@/components/button-link";

import "swiper/css";
import "swiper/css/pagination";

export function DetailGallerySection({
  title = "گالری",
  images,
  viewAllHref,
}: {
  title?: string;
  images: string[];
  viewAllHref?: string;
}) {
  const direction = getLocaleDirection(useLocale());
  const [activeIndex, setActiveIndex] = useState(0);
  if (!images.length) return null;

  return (
    <section className="app-reveal min-w-0 overflow-hidden">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-black text-foreground">{title}</h2>
        {viewAllHref ? (
          <ButtonLink href={viewAllHref} variant="ghost" size="sm" className="font-bold text-accent">
            مشاهده همه
          </ButtonLink>
        ) : null}
      </div>
      <Swiper
        dir={direction}
        slidesPerView="auto"
        spaceBetween={14}
        watchOverflow
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="w-full overflow-visible"
      >
        {images.map((src, index) => (
          <SwiperSlide
            key={`${src}-${index}`}
            className="!w-[12.5rem] sm:!w-[14rem]"
          >
            <Card className="app-card group relative overflow-hidden p-0 shadow-none">
              <div className="relative aspect-[3/4] overflow-hidden bg-surface-secondary">
                <FallbackImage
                  src={src}
                  alt={`${title} ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 200px, 224px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background/85 to-transparent" />
                <span className="absolute end-3 bottom-3 rounded-lg border border-white/10 bg-background/80 px-2 py-1 text-xs font-black tabular-nums text-foreground backdrop-blur-md">
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
              </div>
              <Card.Content className="px-3.5 py-3">
                <Card.Title className="truncate text-sm text-foreground">
                  {title} باشگاه
                </Card.Title>
                <Card.Description className="mt-1 text-xs text-muted">
                  تصویر {(index + 1).toLocaleString("fa-IR")} از{" "}
                  {images.length.toLocaleString("fa-IR")}
                </Card.Description>
              </Card.Content>
              {viewAllHref ? (
                <Link
                  href={viewAllHref}
                  aria-label={`مشاهده تصویر ${(index + 1).toLocaleString("fa-IR")}`}
                  className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus"
                />
              ) : null}
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
      <div
        className="mt-4 flex items-center justify-between"
        aria-label={`تصویر ${activeIndex + 1} از ${images.length}`}
        dir="ltr"
      >
        <div className="flex gap-2">
          {images.slice(0, 5).map((_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-[width,background-color] ${
                index === activeIndex
                  ? "w-8 bg-accent"
                  : "w-4 bg-surface-tertiary"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-bold tabular-nums text-muted">
          {(activeIndex + 1).toLocaleString("fa-IR")}/
          {images.length.toLocaleString("fa-IR")}
        </span>
      </div>
    </section>
  );
}
