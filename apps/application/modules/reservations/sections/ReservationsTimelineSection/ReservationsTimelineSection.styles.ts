import { tv } from "tailwind-variants";

export const reservationsTimelineSectionStyles = tv({
  slots: {
    root: "flex flex-1 flex-col px-5 pt-5",
    toolbar: "mb-5 flex items-center justify-between gap-3",
    title: "text-lg font-bold text-foreground",
    sort: "h-auto min-h-0 gap-1.5 px-1 py-1 text-sm text-muted",
    sortIcon: "text-accent",
    list: "relative flex flex-col gap-5 pb-8",
    line: "pointer-events-none absolute start-[2.4rem] top-4 bottom-6 border-s-2 border-dashed border-separator",
    empty: "py-16 text-center text-muted",
    skeleton: "h-[4.75rem] rounded-[1.35rem] border border-white/7 bg-surface/72",
  },
});

export const reservationTimelineRowStyles = tv({
  slots: {
    root: "relative z-[1] flex items-center gap-3",
    time: "h-7 min-h-7 shrink-0 gap-1 rounded-full border-none bg-surface-secondary px-2.5 text-[0.7rem] text-muted",
    timeIcon: "text-muted",
    card: "app-card app-stack-card flex min-w-0 flex-1 flex-row items-center gap-0 p-3 shadow-none",
    iconBox:
      "flex size-12 shrink-0 items-center justify-center rounded-[1rem] bg-surface-secondary text-accent",
    body: "flex min-w-0 flex-1 flex-col gap-1.5",
    name: "truncate text-[0.95rem] leading-5 font-bold text-foreground",
    meta: "flex flex-wrap items-center gap-x-3 gap-y-1",
    metaItem: "flex items-center gap-1 text-xs text-muted",
    metaAccent: "text-accent",
    metaMuted: "text-muted",
  },
  variants: {
    selected: {
      true: {
        root: "gap-2",
        card: "shadow-[0_16px_38px_color-mix(in_oklch,var(--accent)_14%,transparent)]",
      },
      false: {
        root: "gap-3",
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});
