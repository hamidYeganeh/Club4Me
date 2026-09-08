import { tv } from "tailwind-variants";

export const clubCardStyles = tv({
  slots: {
    root: "group relative isolate shrink-0 gap-0 overflow-hidden rounded-[var(--club-card-radius)] border-none bg-surface p-0 shadow-md transition-transform duration-300 active:scale-[0.985] [--club-card-padding:16px] [--club-card-radius:var(--app-radius-feature,24px)]",
    image:
      "pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.02] select-none",
    shade:
      "pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent",
    content:
      "absolute inset-0 z-[2] flex flex-col justify-between p-[var(--club-card-padding)] text-foreground",
    top: "flex items-start justify-between gap-3",
    rating:
      "flex h-9 items-center gap-1.5 rounded-full border border-border/40 bg-background/75 px-3 text-foreground shadow-sm backdrop-blur-md",
    ratingIcon: "text-warning",
    ratingText: "font-semibold tabular-nums",
    reviews: "text-muted tabular-nums",
    actions: "relative z-[4] flex gap-2",
    iconButton:
      "size-9 min-w-9 rounded-full border border-border/40 bg-background/75 text-foreground shadow-sm backdrop-blur-md",
    body: "flex min-w-0 flex-col gap-3",
    sports:
      "mt-2 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden",
    sport:
      "inline-flex max-w-[6.5rem] shrink items-center gap-1 rounded-full border border-border/50 bg-background/35 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-md",
    sportIcon: "shrink-0 text-accent",
    sportLabel: "min-w-0 truncate",
    sportMore:
      "inline-flex shrink-0 items-center rounded-full border border-border/50 bg-background/35 px-2.5 py-1 text-xs font-bold tabular-nums text-foreground backdrop-blur-md",
    bottom: "flex min-w-0 items-end justify-between gap-3",
    identity: "min-w-0 flex-1",
    title: "m-0 line-clamp-2 font-bold text-foreground drop-shadow-sm",
    details: "mt-1 flex min-w-0 items-center gap-1.5 text-foreground/85",
    detailIcon: "shrink-0",
    detailText: "min-w-0 truncate",
    priceBlock: "shrink-0 text-end",
    pricePrefix: "text-xs font-medium text-foreground/70",
    priceLine: "flex items-baseline justify-end gap-1",
    price: "text-2xl font-bold tracking-tight text-foreground tabular-nums",
    priceSuffix: "text-xs font-medium text-foreground/75",
    link: "absolute inset-0 z-[3] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
  },
  variants: {
    variant: {
      compact: {
        root: "aspect-[16/10] h-auto w-[360px] max-w-full",
        shade:
          "bg-gradient-to-t from-background via-background/30 to-transparent",
        title: "text-xl leading-6",
        price: "text-base",
      },
      editorial: {
        root: "aspect-[3/4] h-auto w-[320px] max-w-full",
        shade:
          "bg-gradient-to-t from-background via-background/65 to-transparent",
        title: "text-2xl leading-7",
        price: "text-base",
      },
    },
  },
  defaultVariants: { variant: "compact" },
});
