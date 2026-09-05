import { tv } from "tailwind-variants";

export const reservationsTimelineSectionStyles = tv({
  slots: {
    root: "flex flex-1 flex-col px-5 pt-5",
    toolbar: "app-surface mb-7 flex min-h-16 items-center justify-between gap-3 rounded-[1.2rem] px-4",
    title: "text-lg font-black text-foreground",
    sort: "h-auto min-h-0 gap-1.5 px-0 py-1 text-sm font-semibold text-muted",
    sortIcon: "text-accent",
    list: "relative flex flex-col gap-6 pb-10",
    line: "pointer-events-none absolute start-[2.05rem] inset-y-0 border-s border-separator",
    empty: "flex min-h-[calc(100dvh-15rem)] flex-1 flex-col items-center justify-center px-2 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center",
    emptyVisual: "relative isolate mb-2 grid w-full max-w-[17rem] place-items-center",
    emptyGlow: "absolute bottom-[10%] -z-10 h-12 w-3/4 rounded-full bg-accent/18 blur-2xl",
    emptyImage: "size-full object-contain",
    emptyCopy: "mt-1 flex flex-col items-center gap-2",
    emptyTitle: "text-balance text-2xl leading-9 font-black text-foreground",
    emptyDescription: "max-w-[28ch] text-sm leading-6 text-muted",
    explore: "mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-accent px-5 text-base font-black text-accent-foreground transition-transform active:scale-[0.985]",
    skeleton: "h-[4.75rem] rounded-[1.35rem] border border-white/7 bg-surface/72",
  },
});

export const reservationTimelineRowStyles = tv({
  slots: {
    root: "relative z-[1] flex min-h-[7.5rem] items-center gap-3",
    timeRail: "relative flex w-[4.1rem] shrink-0 items-center justify-center self-stretch",
    time: "z-[1] h-auto min-h-8 shrink-0 rounded-[0.7rem] border border-border bg-surface px-2.5 py-1 text-[0.72rem] font-bold text-muted shadow-none",
    timeLabel: "flex flex-col items-center leading-4",
    timeDate: "text-[0.58rem] font-medium text-muted",
    timeIcon: "text-muted",
    card: "relative flex min-w-0 flex-1 overflow-hidden rounded-[1.25rem] border border-border bg-surface p-4",
    cardButton: "h-auto min-h-0 min-w-0 flex-1 items-start justify-start gap-3 rounded-[inherit] p-0 text-start hover:bg-transparent",
    iconBox:
      "flex size-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-surface-secondary text-accent",
    body: "flex min-w-0 flex-1 flex-col gap-1.5",
    status: "text-[0.7rem] font-bold text-accent",
    name: "line-clamp-2 text-[0.98rem] leading-6 font-black text-foreground",
    meta: "mt-1 flex min-w-0 flex-wrap items-center gap-2 text-[0.7rem] text-muted",
    metaItem: "flex min-w-0 items-center gap-1 whitespace-nowrap",
    metaDivider: "size-1 rounded-full bg-separator",
    metaAccent: "text-accent",
    metaMuted: "text-muted",
  },
  variants: {
    selected: {
      true: {
        card: "border-foreground/18",
      },
      false: {},
    },
  },
  defaultVariants: {
    selected: false,
  },
});
