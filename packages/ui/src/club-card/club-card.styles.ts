import { tv } from "tailwind-variants";

export const clubCardStyles = tv({
  slots: {
    root: "group relative isolate shrink-0 gap-0 overflow-hidden rounded-[var(--club-card-radius)] border-none bg-surface p-0 shadow-md transition-transform duration-300 [--club-card-padding:16px] [--club-card-radius:var(--app-radius-feature,24px)]",
    image:
      "pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-500 select-none",
    shade:
      "pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent",
    shadeEdge:
      "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[68%] overflow-hidden",
    shadeGradient:
      "pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-surface/55 to-transparent",
    shadeBlur:
      "pointer-events-none absolute inset-0 [backdrop-filter:blur(var(--blur))] [-webkit-backdrop-filter:blur(var(--blur))] [mask-image:linear-gradient(to_top,black,transparent_var(--reach))] [-webkit-mask-image:linear-gradient(to_top,black,transparent_var(--reach))] motion-reduce:[backdrop-filter:none] motion-reduce:[-webkit-backdrop-filter:none]",
    content:
      "absolute inset-0 z-[2] flex flex-col justify-between p-[var(--club-card-padding)] text-foreground",
    top: "flex items-start justify-between gap-3",
    priceBadge:
      "relative z-[4] flex h-9 max-w-[70%] items-center gap-1 rounded-full bg-surface/80 px-3 text-foreground shadow-sm backdrop-blur-md",
    priceBadgeAmount: "truncate text-sm font-bold tabular-nums",
    priceBadgeSuffix: "shrink-0 text-xs font-medium text-foreground/75",
    rating:
      "flex h-9 items-center gap-1.5 rounded-full bg-background/75 px-3 text-foreground shadow-sm backdrop-blur-md",
    ratingIcon: "text-warning",
    ratingText: "font-semibold tabular-nums",
    reviews: "text-muted tabular-nums",
    actions: "relative z-[4] flex gap-2",
    iconButton:
      "size-9 min-w-9 rounded-full bg-background/75 text-foreground shadow-sm backdrop-blur-md",
    body: "flex min-w-0 flex-col gap-3",
    sports:
      "mt-2 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden",
    sport:
      "inline-flex max-w-[6.5rem] shrink items-center gap-1 rounded-full bg-background/35 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-md",
    sportIcon: "shrink-0 text-accent",
    sportLabel: "min-w-0 truncate",
    sportMore:
      "inline-flex shrink-0 items-center rounded-full bg-background/35 px-2.5 py-1 text-xs font-bold tabular-nums text-foreground backdrop-blur-md",
    bottom: "flex min-w-0 items-end justify-between gap-3",
    identity: "min-w-0 flex-1",
    titleRow: "flex min-w-0 items-start justify-between gap-3",
    title: "m-0 line-clamp-2 font-bold text-foreground drop-shadow-sm",
    titleRating:
      "mt-0.5 flex shrink-0 items-center gap-1 text-foreground",
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
      overlay: {
        root: "aspect-[3/4] h-auto w-[320px] max-w-full [--club-card-padding:18px]",
        shade: "hidden",
        content: "justify-between text-foreground",
        iconButton:
          "size-9 min-w-9 rounded-full border-none bg-surface/55 text-foreground shadow-sm backdrop-blur-md",
        body: "gap-0",
        bottom: "flex-col items-stretch gap-0",
        identity: "w-full",
        title: "min-w-0 flex-1 text-xl leading-6",
        titleRating: "text-sm font-semibold",
        ratingIcon: "text-warning",
        ratingText: "font-semibold tabular-nums",
        reviews: "font-normal text-foreground/70 tabular-nums",
        details: "mt-1.5 text-foreground/80",
        sports: "mt-3 gap-3 overflow-hidden",
        sport:
          "inline-flex max-w-none shrink items-center gap-1.5 rounded-none bg-transparent p-0 text-xs font-medium text-foreground/85 backdrop-blur-none",
        sportIcon: "shrink-0 text-foreground/85",
        sportMore:
          "inline-flex shrink-0 items-center rounded-none bg-transparent p-0 text-xs font-bold tabular-nums text-foreground/70 backdrop-blur-none",
        priceBlock: "hidden",
      },
    },
  },
  defaultVariants: { variant: "compact" },
});
