import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const clubCardVariants = tv({
  slots: {
    root: ["relative flex overflow-hidden rounded-[24px]"].join(" "),
    media: "absolute inset-0 overflow-hidden",
    image:
      "pointer-events-none absolute inset-0 size-full object-cover select-none",
    mediaScrim:
      "pointer-events-none absolute inset-0 bg-linear-to-t from-background to-transparent",
    topBar: "relative z-10 flex w-full items-start justify-between gap-3",
    ratingChip: [
      "h-8 max-w-full border-0 px-2.5",
      "backdrop-blur-md",
      "[--chip-bg:color-mix(in_oklch,var(--stats-foreground)_25%,transparent)]",
      "[--chip-fg:var(--stats-foreground)]",
      "[&_.chip__label]:font-medium",
    ].join(" "),
    ratingChipIcon: "size-3.5 shrink-0 text-stats-foreground",
    ratingCount: "opacity-80",
    stars: "flex items-center gap-0.5",
    star: "shrink-0 text-accent",
    starEmpty: "shrink-0 text-stats-foreground/35",
    actions: "flex items-center gap-2",
    iconButton: "shrink-0 rounded-full",
    body: "relative z-10 mt-auto flex w-full min-w-0 flex-col",
    header: "min-w-0 p-0",
    title: "tracking-tight text-foreground",
    subtitle: "text-muted",
    location: "flex min-w-0 items-center gap-1.5 text-muted",
    locationIcon: "size-3.5 shrink-0 text-muted",
    features: "flex flex-wrap items-center gap-2",
    feature: [
      "h-7 max-w-full gap-1 border-0 px-2.5",
      "backdrop-blur-md",
      "[--chip-bg:color-mix(in_oklch,var(--foreground)_12%,var(--surface))]",
      "[--chip-fg:var(--foreground)]",
      "[&_.chip__label]:text-xs [&_.chip__label]:font-medium",
    ].join(" "),
    featureIcon: "size-3 shrink-0 text-accent",
    divider:
      "bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
    footer: "flex w-full min-w-0 items-end justify-between gap-3",
    priceGroup: "flex min-w-0 flex-wrap items-baseline gap-1 text-foreground",
    pricePrefix: "text-xs font-normal text-muted",
    price: "font-semibold text-foreground",
    priceSuffix: "text-xs font-normal text-muted",
    action: "shrink-0",
    ctaGroup: "flex shrink-0 flex-col items-end gap-2",
    badges: "flex flex-wrap items-center gap-2",
    statusBadge: [
      "inline-flex h-8 max-w-full items-center gap-2 rounded-full px-3",
      "border-0 backdrop-blur-md",
      "[--chip-bg:color-mix(in_oklch,var(--background)_82%,transparent)]",
      "[--chip-fg:var(--foreground)]",
      "[&_.chip__label]:text-xs [&_.chip__label]:font-medium",
    ].join(" "),
    statusDot: "size-1.5 shrink-0 rounded-full bg-foreground",
    titleRow: "flex w-full min-w-0 items-start justify-between gap-3",
    listingFeature: [
      "h-7 max-w-full gap-1 border border-border/80 bg-background/90 px-2.5",
      "[--chip-bg:transparent] [--chip-fg:var(--muted)]",
      "[&_.chip__label]:text-xs [&_.chip__label]:font-medium",
    ].join(" "),
    shareButton: [
      "shrink-0 rounded-full bg-foreground text-background",
      "[--button-bg:var(--foreground)] [--button-fg:var(--background)]",
    ].join(" "),
    favoriteButton:
      "shrink-0 rounded-full border border-border/70 bg-background/85 backdrop-blur-md",
  },
  variants: {
    orientation: {
      horizontal: {
        root: "aspect-[4/3] w-full max-w-xl flex-col p-6",
        body: "flex-row items-end justify-between gap-4",
        header: "flex-1 gap-1",
        title: "text-xl font-semibold sm:text-2xl",
        subtitle: "text-sm sm:text-base",
        price: "text-sm font-medium",
        action: "rounded-full",
      },
      vertical: {
        root: "aspect-[3/4] w-full max-w-[300px] flex-col p-5",
        body: "gap-3",
        header: "gap-1.5",
        title: "text-2xl font-semibold leading-tight",
        location: "text-sm",
        footer: "pt-0.5",
        price: "text-xl leading-none",
        action: [
          "rounded-[0.875rem] px-3.5 text-xs font-bold tracking-wide",
          "[--button-bg:var(--accent)] [--button-fg:var(--accent-foreground)]",
          "[--button-bg-hover:var(--accent)] [--button-bg-pressed:var(--accent)]",
          "bg-accent text-accent-foreground",
          "hover:opacity-90 data-[hovered=true]:opacity-90",
          "data-[pressed=true]:scale-[0.97]",
        ].join(" "),
      },
      fullWidth: {
        root: [
          "aspect-[16/10] w-full max-w-none flex-col rounded-[28px] p-5",
          "sm:aspect-[21/9] sm:p-6",
        ].join(" "),
        body: "flex-row items-end justify-between gap-4",
        header: "flex-1 gap-1",
        title: "text-2xl font-semibold sm:text-3xl",
        subtitle: "text-sm sm:text-base",
        price: "text-base font-semibold",
        action: [
          "rounded-full px-4",
          "[--button-bg:var(--accent)] [--button-fg:var(--accent-foreground)]",
          "bg-accent text-accent-foreground",
        ].join(" "),
      },
      listing: {
        root: [
          "aspect-auto min-h-[22rem] w-full max-w-none flex-col rounded-[1.75rem]",
          "bg-background shadow-sm",
        ].join(" "),
        mediaScrim: [
          "bg-linear-to-t from-background from-30% via-background/92 via-52%",
          "to-transparent to-72%",
        ].join(" "),
        topBar:
          "absolute inset-x-0 top-0 z-20 flex w-full items-start justify-end gap-2 p-4",
        body: "gap-3 px-4 pb-4 pt-1",
        badges: "pb-0.5",
        titleRow: "items-baseline",
        title:
          "min-w-0 flex-1 text-lg font-semibold leading-tight text-foreground",
        price: "shrink-0 text-lg font-semibold leading-none text-foreground",
        subtitle: "text-sm text-muted",
        features: "gap-1.5",
      },
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type ClubCardVariantProps = VariantProps<typeof clubCardVariants>;
