import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const coachFeatureCardVariants = tv({
  slots: {
    root: [
      "relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-[28px]",
      "outline-none transition-transform duration-fast ease-app",
      "data-[pressable=true]:cursor-pointer",
      "data-[pressable=true]:active:scale-[0.985]",
    ].join(" "),
    media: "absolute inset-0 overflow-hidden",
    image:
      "pointer-events-none absolute inset-0 size-full object-cover select-none",
    mediaScrim: [
      "pointer-events-none absolute inset-0",
      "bg-linear-to-t from-black via-black/70 to-transparent",
    ].join(" "),
    topBar: "relative z-10 flex w-full items-start justify-between gap-3 p-3",
    newBadge: [
      "h-7 border-0 px-2.5",
      "[--chip-bg:var(--foreground)] [--chip-fg:var(--background)]",
      "[&_.chip__label]:text-xs [&_.chip__label]:font-semibold",
    ].join(" "),
    closeButton: [
      "size-9 shrink-0 rounded-full bg-overlay/90 text-overlay-foreground",
      "hover:bg-overlay data-[hovered=true]:bg-overlay",
      "data-[pressed=true]:scale-[0.96]",
    ].join(" "),
    body: [
      "relative z-10 mt-auto flex w-full min-w-0 flex-col items-center gap-1.5",
      "p-4 pt-10 text-center",
    ].join(" "),
    title: "tracking-tight text-white",
    specialty: "text-white/55",
    ratingRow: "mt-0.5 flex items-center justify-center gap-1.5",
    stars: "flex items-center gap-0.5",
    star: "shrink-0 text-accent",
    starEmpty: "shrink-0 text-white/25",
    ratingText: "text-sm text-white",
    ratingCount: "text-white/70",
    meta: "mt-1.5 flex w-full items-center justify-between gap-3",
    metaItem:
      "inline-flex items-center gap-1 text-xs font-medium text-white/85",
    metaIconSuccess: "size-3.5 shrink-0 text-success",
    metaIconMuted: "size-3.5 shrink-0 text-white/55",
  },
});

export type CoachFeatureCardVariantProps = VariantProps<
  typeof coachFeatureCardVariants
>;
