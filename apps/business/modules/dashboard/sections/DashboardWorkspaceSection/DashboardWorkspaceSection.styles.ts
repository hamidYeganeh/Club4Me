import { tv } from "tailwind-variants";

export const dashboardWorkspaceSectionStyles = tv({
  slots: {
    root: "grid flex-1 gap-4 lg:grid-cols-12",
    tabsRow: "col-span-full flex flex-wrap items-center justify-between gap-3",
    welcome:
      "app-card col-span-full flex min-h-[8.5rem] items-center justify-between gap-4 border-transparent bg-accent p-6 text-accent-foreground shadow-none lg:col-span-8",
    welcomeCopy: "min-w-0",
    welcomeTitle: "text-2xl font-semibold tracking-tight sm:text-3xl",
    welcomeSubtitle: "mt-1 text-sm text-accent-foreground/80",
    welcomeAction:
      "flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background",
    calorie:
      "app-card col-span-full flex min-h-[14rem] flex-col p-5 shadow-none lg:col-span-4",
    steps: "app-card col-span-full min-h-[12rem] p-5 shadow-none sm:col-span-6 lg:col-span-4",
    hydration:
      "app-card col-span-full min-h-[12rem] p-5 shadow-none sm:col-span-6 lg:col-span-4",
    upcoming:
      "app-card col-span-full flex min-h-[14rem] flex-col justify-between border-transparent bg-[var(--chart-2)] p-5 text-white shadow-none lg:col-span-4",
    score: "app-card col-span-full min-h-[16rem] p-5 shadow-none lg:col-span-8",
    movements: "app-card col-span-full overflow-hidden p-5 shadow-none",
    table: "mt-4 w-full min-w-[36rem] border-separate border-spacing-y-2 text-sm",
    chipEasy: "rounded-full bg-[var(--chart-2)]/15 px-2.5 py-1 text-xs text-[var(--chart-2)]",
    chipHard: "rounded-full bg-danger/15 px-2.5 py-1 text-xs text-danger",
    chipNormal: "rounded-full bg-muted/20 px-2.5 py-1 text-xs text-muted",
    progressTrack: "h-2 w-28 overflow-hidden rounded-full bg-surface-secondary",
    progressFill: "h-full rounded-full",
    suggestion:
      "app-card col-span-full flex items-center justify-between gap-4 border-transparent bg-accent p-5 text-accent-foreground shadow-none",
    aiBanner:
      "app-card col-span-full flex items-center justify-between gap-4 border-transparent bg-[var(--chart-2)] p-5 text-white shadow-none",
    cardTitle: "text-sm text-muted",
    cardValue: "mt-1 text-2xl font-semibold tabular-nums",
    legend: "mt-3 flex flex-wrap gap-4 text-xs text-muted",
    legendDot: "inline-block size-2 rounded-full",
  },
});
