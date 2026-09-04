import { tv } from "tailwind-variants";

export const discoveryClassesRailSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    scroller: "-mx-5 overflow-x-auto px-5",
    track: "flex w-max snap-x snap-mandatory flex-nowrap gap-3 pb-1",
    card: "group relative w-[min(72vw,16.5rem)] min-w-[min(72vw,16.5rem)] shrink-0 snap-start no-underline outline-none transition-transform duration-200 ease-out active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-focus",
    imageWrap:
      "relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-tertiary",
    image:
      "object-cover transition-transform duration-700 group-hover:scale-105",
    badge:
      "absolute end-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md",
    seats:
      "absolute start-2 bottom-2 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur-md",
    body: "mt-3 flex min-w-0 flex-col gap-1",
    sport: "text-xs font-medium text-muted",
    name: "line-clamp-1 text-base font-extrabold leading-6 text-foreground",
    description: "line-clamp-2 text-xs leading-5 text-muted",
    price: "mt-1 text-sm font-bold text-foreground",
    skeleton:
      "aspect-[4/3] w-[min(72vw,16.5rem)] min-w-[min(72vw,16.5rem)] shrink-0 rounded-2xl border border-white/7 bg-surface/72",
  },
});
