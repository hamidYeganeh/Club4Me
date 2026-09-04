import { tv } from "tailwind-variants";

export const discoveryHomeBannerSectionStyles = tv({
  slots: {
    root: "group app-scroll-media overflow-hidden rounded-[1.75rem] bg-surface shadow-[0_16px_38px_color-mix(in_oklch,var(--background)_48%,transparent)]",
    swiper:
      "h-[13.75rem] w-full [&_.swiper-pagination]:bottom-3 [&_.swiper-pagination-bullet]:h-2 [&_.swiper-pagination-bullet]:w-2 [&_.swiper-pagination-bullet]:bg-white/50 [&_.swiper-pagination-bullet-active]:w-6 [&_.swiper-pagination-bullet-active]:rounded-full [&_.swiper-pagination-bullet-active]:bg-white",
    slide: "relative h-[13.75rem]",
    image:
      "object-cover saturate-75 contrast-110 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:saturate-100",
    overlay: "absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/10",
  },
});
