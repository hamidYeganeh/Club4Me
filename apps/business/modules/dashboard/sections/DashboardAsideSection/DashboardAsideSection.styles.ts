import { tv } from "tailwind-variants";

export const dashboardAsideSectionStyles = tv({
  slots: {
    root: [
      "flex w-full flex-col gap-4",
      "lg:w-[19.5rem] lg:shrink-0 lg:self-stretch",
      "lg:rounded-[1.75rem] lg:bg-accent lg:p-4 lg:text-accent-foreground",
      "dark:lg:bg-accent",
    ].join(" "),
    profile: "flex flex-col items-start gap-1 px-1 pt-2 text-start lg:px-2",
    hello: "text-sm text-muted lg:text-accent-foreground/75",
    name: "text-2xl font-semibold tracking-tight",
    meta: "mt-1 flex flex-wrap items-center gap-3 text-xs text-muted lg:text-accent-foreground/80",
    promo:
      "app-card overflow-hidden border-transparent bg-surface p-5 text-foreground shadow-none lg:bg-accent-foreground/10 lg:text-accent-foreground dark:lg:bg-background/20",
    promoList: "mt-3 space-y-2 text-sm",
    exercises: "space-y-2",
    exerciseItem:
      "flex w-full items-center gap-3 rounded-[1.15rem] border border-transparent bg-background/95 p-3 text-foreground transition hover:border-accent/30 dark:bg-surface",
    calendar:
      "app-card p-5 shadow-none lg:border-transparent lg:bg-background/95 lg:text-foreground dark:lg:bg-surface",
    week: "mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted",
    days: "mt-2 grid grid-cols-7 gap-1",
    day: "flex size-8 items-center justify-center rounded-full text-xs",
    dayOn: "bg-accent text-accent-foreground",
    legend: "mt-4 flex flex-wrap gap-3 text-[11px] text-muted",
    vitals:
      "app-card mt-auto grid grid-cols-3 gap-2 border-transparent bg-background p-4 text-foreground shadow-none dark:bg-surface",
    vital: "flex flex-col items-center gap-1 text-center",
    vitalValue: "text-sm font-semibold tabular-nums",
    vitalLabel: "text-[10px] text-muted",
    addBtn:
      "flex w-full items-center justify-center gap-2 rounded-[1.15rem] border border-dashed border-accent-foreground/50 bg-transparent px-4 py-3 text-sm font-medium text-accent-foreground lg:border-accent-foreground/60",
  },
});
