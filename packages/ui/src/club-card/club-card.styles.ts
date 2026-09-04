import { tv } from "tailwind-variants";

export const clubCardStyles = tv({
  slots: {
    root: "group relative isolate shrink-0 gap-0 overflow-hidden rounded-[var(--club-card-radius)] border-none bg-surface p-0 shadow-md [--club-card-padding:16px] [--club-card-radius:24px]",
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
    body: "flex min-w-0 flex-col",
    heading: "flex min-w-0 items-end justify-between gap-3",
    identity: "min-w-0",
    title: "m-0 line-clamp-2 font-bold text-foreground drop-shadow-sm",
    details: "mt-1 flex min-w-0 items-center gap-1.5 text-foreground/85",
    detailIcon: "shrink-0",
    detailText: "min-w-0 truncate",
    amenityList: "mt-4 flex flex-wrap gap-2",
    amenity:
      "rounded-full border border-border/60 bg-background/20 px-3 text-foreground backdrop-blur-md",
    amenityInner: "flex items-center gap-1.5",
    amenityIcon: "text-accent",
    divider: "my-4 h-px bg-border/60",
    bottom: "flex items-end justify-between gap-3",
    priceBlock: "min-w-0",
    pricePrefix: "mb-0.5 text-xs text-foreground/70",
    priceLine: "flex items-baseline gap-1",
    price: "text-2xl font-bold tracking-tight text-foreground tabular-nums",
    priceSuffix: "text-xs text-foreground/75",
    action:
      "relative z-[4] shrink-0 rounded-full bg-accent px-5 font-semibold text-accent-foreground shadow-sm",
    link: "absolute inset-0 z-[3] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
  },
  variants: {
    variant: {
      compact: {
        root: "aspect-[16/10] h-auto w-[360px] max-w-full",
        shade:
          "bg-gradient-to-t from-background via-background/30 to-transparent",
        title: "text-xl leading-6",
        body: "gap-0",
        heading: "items-end",
        action: "h-10 px-4",
      },
      editorial: {
        root: "aspect-[3/4] h-auto w-[320px] max-w-full",
        shade:
          "bg-gradient-to-t from-background via-background/65 to-transparent",
        title: "text-2xl leading-7",
        body: "gap-0",
        heading: "block",
        action: "h-11 px-6",
      },
    },
  },
  defaultVariants: { variant: "compact" },
});
