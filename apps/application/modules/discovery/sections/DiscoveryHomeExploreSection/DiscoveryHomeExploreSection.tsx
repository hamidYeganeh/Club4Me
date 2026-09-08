"use client";

import Link from "@/components/app-link";
import { useLocale, useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Icon, type IconName } from "@theme/icon";
import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";

import "swiper/css";
import "swiper/css/free-mode";

const ITEMS: Array<{ href: string; title: string; icon: IconName }> = [
  { href: "/discovery/search", title: "جست‌وجو", icon: "magnifying-glass" },
  { href: "/discovery/clubs", title: "باشگاه‌ها", icon: "weight" },
  { href: "/discovery/coaches", title: "مربی‌ها", icon: "user" },
  { href: "/discovery/classes", title: "کلاس‌ها", icon: "calendar-1" },
  { href: "/discovery/map", title: "نقشه", icon: "map-trifold" },
];

export function DiscoveryHomeExploreSection() {
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());

  return (
    <section
      className="app-reveal flex flex-col gap-4"
      aria-labelledby="explore-title"
    >
      <DiscoverySectionHeader
        id="explore-title"
        title={t("exploreTitle")}
        subtitle={t("exploreSubtitle")}
      />
      <div dir={direction}>
        <Swiper
          dir={direction}
          modules={[FreeMode]}
          freeMode
          slidesPerView="auto"
          spaceBetween={12}
          watchOverflow
          className="w-full"
        >
          {ITEMS.map((item) => (
            <SwiperSlide key={item.href} className="w-auto!">
              <Link
                href={item.href}
                className="app-card group flex w-22 shrink-0 flex-col items-center gap-2 p-4 text-center text-xs font-bold text-foreground no-underline"
              >
                <span className="grid size-11 place-items-center rounded-[1rem] bg-accent text-accent-foreground transition-transform duration-500 ease-out group-hover:scale-105">
                  <Icon name={item.icon} size={22} />
                </span>
                {item.title}
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
