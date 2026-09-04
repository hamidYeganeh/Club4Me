import { tv } from "tailwind-variants";

export const coachCardStyles = tv({
  slots: {
    root: "relative isolate shrink-0 gap-0 overflow-hidden rounded-[24px] border-none bg-surface p-0 shadow-none",
    image: "pointer-events-none absolute inset-0 size-full object-cover select-none",
    blur: "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[58%]",
    blurLayer: "absolute inset-0",
    fade: "absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent",
    content: "absolute inset-4 z-[2] flex flex-col justify-between",
    header: "flex items-start justify-between gap-3",
    badge:
      "max-w-[70%] rounded-full border-none bg-foreground px-2.5 text-background",
    action:
      "z-[3] size-8 min-w-8 rounded-full border border-border bg-background/80 text-foreground shadow-none backdrop-blur-md",
    actionMark: "block size-3.5 rounded-full border-[1.5px] border-current",
    footer: "flex min-w-0 flex-col",
    title: "m-0 line-clamp-2 font-bold text-foreground",
    supporting: "line-clamp-1 text-foreground",
    rating: "flex min-w-0 items-center gap-1.5",
    stars: "flex items-center gap-px text-warning",
    star: "size-3.5",
    ratingValue: "m-0 font-bold text-foreground tabular-nums leading-none",
    reviews: "m-0 text-foreground tabular-nums leading-none",
    stats: "flex min-w-0 items-center gap-2",
    stat: "flex min-w-0 items-center gap-1.5 text-foreground",
    statIcon: "size-3.5 shrink-0",
    statMark: "size-3.5 shrink-0 rounded-full border border-current",
    statLabel: "min-w-0 truncate",
    statsDot: "size-1 shrink-0 rounded-full bg-muted",
    meta: "flex min-w-0 items-center gap-1.5 text-muted",
    metaItem: "min-w-0 truncate",
    metaDot: "size-1 shrink-0 rounded-full bg-muted",
    author: "flex min-w-0 items-center gap-2",
    avatar: "size-6 shrink-0",
    authorName: "min-w-0 truncate text-foreground",
    link: "absolute inset-0 z-[1] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus",
  },
  variants: {
    type: {
      normal: {
        root: "aspect-[276/367] h-auto w-[276px] max-w-full",
        footer: "gap-1",
        title: "text-xl leading-6",
        supporting: "text-sm leading-5",
        rating: "mt-1",
        stats: "mt-2",
      },
      compact: {
        root: "aspect-[260/280] h-auto w-[260px] max-w-full",
        footer: "gap-1.5",
        title: "text-lg leading-6",
        meta: "text-sm leading-5",
        author: "mt-1",
      },
    },
  },
  defaultVariants: {
    type: "normal",
  },
});
