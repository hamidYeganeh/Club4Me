import { tv } from "tailwind-variants";

export const discoveryClubsDetailBodySectionStyles = tv({
  slots: {
    root: "relative z-10 -mt-8 flex flex-1 flex-col gap-6 bg-background px-5 pb-28 pt-6 rounded-t-[calc(var(--radius)*5)]",
    thumbsSwiper:
      "w-full [&_.swiper-slide-thumb-active]:opacity-100 [&_.swiper-slide]:opacity-55",
    thumbSlide:
      "relative !box-border !h-[5.5rem] cursor-pointer overflow-hidden rounded-[calc(var(--radius)*3)]",
    image: "pointer-events-none object-cover",
    stats: "grid grid-cols-2 gap-2.5",
    stat: "flex min-h-16 items-center gap-3 rounded-[calc(var(--radius)*3)] bg-surface-secondary px-3.5 py-3.5",
    statIcon:
      "flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground",
    statText: "min-w-0",
    statValue: "truncate text-sm font-semibold text-foreground",
    statLabel: "truncate text-[11px] text-muted",
    about: "flex flex-col gap-1",
    aboutTitle: "text-xl font-bold text-foreground",
    aboutBody: "text-sm leading-7 text-muted",
  },
  variants: {
    expanded: {
      true: {
        aboutBody: "text-sm leading-7 text-muted",
      },
      false: {
        aboutBody: "line-clamp-3 text-sm leading-7 text-muted",
      },
    },
  },
  defaultVariants: {
    expanded: false,
  },
});
