import { tv } from "tailwind-variants";

export const discoveryHomeDealsSectionStyles = tv({
  slots: {
    root: "relative isolate overflow-hidden rounded-[1.75rem] border border-accent/20 bg-accent/10 px-5 pt-5 pb-6",
    pattern: "pointer-events-none absolute inset-0 opacity-30",
    header: "flex items-start justify-between gap-3",
    copy: "min-w-0 flex-1",
    timer: "flex shrink-0 items-center gap-1 pt-1",
    timeBox:
      "grid size-9 place-items-center rounded-xl bg-foreground text-base font-bold tabular-nums text-background",
    separator: "font-bold text-foreground",
    filters: "mt-5 flex flex-wrap gap-2",
    filter:
      "shrink-0 rounded-full border border-transparent px-3 py-2 text-sm font-bold transition-transform active:scale-[.97]",
    filterActive: "bg-accent text-accent-foreground",
    filterInactive: "border-white/10 bg-background/35 text-muted",
    carouselWrap: "mt-4",
    carousel: "w-full",
    slide: "!w-auto",
    card: "w-[min(78vw,18rem)] shrink-0 snap-start",
    imageWrap:
      "relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-surface-tertiary shadow-[0_14px_30px_color-mix(in_oklch,var(--background)_45%,transparent)]",
    image:
      "object-cover saturate-75 transition-transform duration-700 group-hover:scale-105 group-hover:saturate-100",
    imageOverlay: "absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent",
    qualityBadge:
      "absolute end-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md",
    price:
      "absolute bottom-2 start-2 rounded-xl bg-background/80 px-3 py-2 text-foreground backdrop-blur-md",
    discount:
      "inline-flex rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white",
    previous: "mt-1 text-xs text-muted line-through",
    current: "mt-0.5 text-sm font-bold",
    name: "mt-3 line-clamp-1 text-base leading-6 font-extrabold",
    meta: "mt-1 flex items-center gap-1 text-xs font-medium text-muted",
    star: "text-warning",
    empty: "py-8 text-center text-sm font-medium text-muted",
  },
});
