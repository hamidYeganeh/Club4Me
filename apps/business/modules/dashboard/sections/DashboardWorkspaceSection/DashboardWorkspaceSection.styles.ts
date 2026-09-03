import { tv } from "tailwind-variants";

export const dashboardWorkspaceSectionStyles = tv({
  slots: {
    root: "grid flex-1 gap-4 lg:grid-cols-12",
    tabs: "col-span-full flex flex-wrap items-center justify-between gap-3",
    tab: "pb-2 text-sm text-muted",
    tabActive: "text-foreground border-b-2 border-accent",
    featured:
      "relative min-h-[22rem] overflow-hidden rounded-[1.75rem] border border-border lg:col-span-5 lg:row-span-2",
    featuredImage: "absolute inset-0 size-full object-cover",
    featuredScrim:
      "absolute inset-0 bg-linear-to-t from-background via-background/30 to-transparent",
    featuredBody: "absolute inset-x-0 bottom-0 p-6",
    featuredTitle: "text-4xl font-semibold",
    featuredMeta: "mt-1 text-sm text-muted",
    featuredActions: "mt-4 flex items-center gap-2",
    card: "rounded-[1.75rem] border border-border bg-surface p-5",
    occupancy: "lg:col-span-3 min-h-[10rem]",
    checkins: "lg:col-span-4 min-h-[10rem]",
    score: "lg:col-span-7 min-h-[16rem]",
    mix: "lg:col-span-5 min-h-[12rem]",
    ai: "flex w-full items-center justify-between gap-4 bg-accent text-accent-foreground lg:col-span-7",
    cardTitle: "text-sm text-muted",
    cardValue: "mt-1 text-2xl font-semibold tabular-nums",
    legend: "mt-3 flex gap-4 text-xs text-muted",
  },
});
