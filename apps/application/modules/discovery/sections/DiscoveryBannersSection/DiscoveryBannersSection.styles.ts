import { tv } from "tailwind-variants";

export const discoveryBannersSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    swiper:
      "w-full [&_.swiper-pagination]:bottom-3 [&_.swiper-pagination-bullet]:h-2 [&_.swiper-pagination-bullet]:w-2 [&_.swiper-pagination-bullet]:bg-white/50 [&_.swiper-pagination-bullet-active]:w-6 [&_.swiper-pagination-bullet-active]:rounded-full [&_.swiper-pagination-bullet-active]:bg-white",
    slide: "h-auto",
    card: "group relative block w-full overflow-hidden rounded-[1.5rem] bg-surface shadow-[0_14px_30px_color-mix(in_oklch,var(--background)_45%,transparent)] outline-none focus-visible:ring-2 focus-visible:ring-focus",
    image:
      "object-cover saturate-75 contrast-110 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:saturate-100",
    overlay:
      "absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent",
    content: "absolute inset-x-0 bottom-0 z-[1] flex flex-col gap-1 p-4 text-white",
    title: "line-clamp-2 text-lg font-bold leading-6",
    subtitle: "line-clamp-2 text-sm text-white/80",
    action:
      "mt-2 inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black",
  },
  variants: {
    aspectRatio: {
      "16/9": {
        card: "aspect-[16/9]",
      },
      "9/16": {
        card: "aspect-[9/16]",
        content: "p-3",
        title: "text-base leading-5",
        subtitle: "text-xs",
      },
      "3/4": {
        card: "aspect-[3/4]",
        title: "text-base leading-5",
      },
      "4/3": {
        card: "aspect-[4/3]",
      },
    },
    slidesPerView: {
      "1": {
        slide: "w-full",
      },
      "1.2": {
        slide: "w-full",
      },
      auto: {
        slide: "!w-auto",
      },
    },
    cardWidth: {
      none: {},
      "16/9": {
        card: "w-[min(88vw,22.5rem)]",
      },
      "9/16": {
        card: "w-[min(46vw,12.5rem)]",
      },
      "3/4": {
        card: "w-[min(58vw,15rem)]",
      },
      "4/3": {
        card: "w-[min(78vw,18.75rem)]",
      },
    },
  },
  defaultVariants: {
    aspectRatio: "16/9",
    slidesPerView: "1.2",
    cardWidth: "none",
  },
});
