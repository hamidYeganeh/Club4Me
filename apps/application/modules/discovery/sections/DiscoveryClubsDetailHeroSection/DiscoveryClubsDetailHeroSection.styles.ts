import { tv } from "tailwind-variants";

export const discoveryClubsDetailHeroSectionStyles = tv({
  slots: {
    root: "relative isolate mx-4 mt-[max(1rem,env(safe-area-inset-top))] h-[24rem] min-h-[24rem] w-[calc(100%-2rem)] rounded-[2rem] overflow-hidden bg-background",
    pullContent: "absolute inset-0 z-10 bg-background will-change-transform",
    pullIndicator:
      "absolute inset-x-0 top-0 z-0 flex h-24 origin-top flex-col items-center justify-center gap-1 bg-accent text-xs font-bold text-accent-foreground",
    mainSwiper:
      "absolute inset-0 h-full w-full [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full [&_.swiper-slide]:w-full",
    slide: "relative h-full overflow-hidden",
    image: "object-cover",
    overlay:
      "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-linear-to-t from-black/75 via-black/25 to-transparent",
    topBar:
      "absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]",
    favoriteIcon: "text-danger",
    metaRow:
      "absolute inset-x-0 bottom-6 z-10 flex items-end justify-between gap-4 px-5",
    meta: "min-w-0",
    location: "font-medium text-white/85",
    name: "mt-2 text-2xl leading-9 font-extrabold text-white",
    price:
      "shrink-0 rounded-full bg-accent px-3 py-2 text-xs font-bold text-accent-foreground",
  },
});
