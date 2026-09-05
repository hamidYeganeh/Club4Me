import { tv } from "tailwind-variants";

export const landingTrustSectionStyles = tv({
  slots: {
    root: "relative isolate mt-3 overflow-hidden rounded-(--radius-card-lg) bg-background px-5 py-16 sm:px-10 sm:py-20",
    badges:
      "relative z-20 flex flex-col justify-between gap-6 sm:flex-row sm:items-start",
    percent:
      "grid size-28 place-content-center rounded-full bg-surface-secondary text-center sm:size-32",
    percentValue: "text-2xl font-bold text-foreground",
    percentCaption: "mx-auto max-w-[8em] text-[0.6rem] text-muted",
    badgeCard:
      "flex max-w-md gap-4 rounded-[1.5rem] bg-surface p-5 sm:gap-5 sm:p-6",
    chip: "rounded-[0.875rem] bg-background px-4 py-2 text-xl font-bold text-foreground",
    badgeTitle: "text-lg font-bold text-foreground",
    badgeBody: "mt-1 text-xs leading-relaxed text-muted",
    ghost:
      "pointer-events-none relative z-0 mx-auto mt-8 max-w-[88rem] select-none text-[clamp(1.5rem,8.2vw,6rem)] font-bold leading-[1.02] tracking-tight uppercase sm:mt-12",
    ghostRow: "flex justify-between gap-4",
    ghostWord: "will-change-transform text-(--ghost)",
    coachWrap:
      "relative z-10 mx-auto mt-8 w-52 sm:absolute sm:top-1/2 sm:left-1/2 sm:mt-0 sm:w-64 sm:-translate-x-1/2 sm:-translate-y-1/2",
    coachCard: "w-full max-w-none rotate-3",
    controls: "relative z-20 mt-12 flex items-center justify-between sm:mt-24",
  },
  variants: {
    ink: {
      true: { ghostWord: "text-foreground" },
      false: { ghostWord: "text-(--ghost)" },
    },
  },
  defaultVariants: { ink: false },
});
