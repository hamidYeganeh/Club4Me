import { tv } from "tailwind-variants";

export const dashboardWorkspaceSectionStyles = tv({
  slots: {
    root: "grid flex-1 gap-4 lg:grid-cols-12",
    card: "rounded-[1.75rem] border border-border bg-surface p-5",
    cardTitle: "text-sm text-muted",
    cardValue: "mt-1 text-3xl font-semibold tabular-nums tracking-tight",
    score: "lg:col-span-7 min-h-[17rem]",
    activity: "lg:col-span-5 min-h-[17rem]",
    suggestion:
      "flex items-center justify-between gap-4 lg:col-span-4 min-h-[7.5rem]",
    hours: "lg:col-span-4 min-h-[12rem]",
    checkins: "lg:col-span-4 min-h-[12rem]",
    bookings: "lg:col-span-4 min-h-[12rem]",
    range: "mt-4 flex flex-wrap gap-1",
    rangeBtn:
      "rounded-full px-3 py-1 text-xs text-muted transition-colors hover:text-foreground",
    rangeActive: "bg-accent text-accent-foreground",
    dots: "mt-6 grid grid-cols-10 gap-2",
    dot: "size-2.5 rounded-full bg-default",
    dotOn: "bg-accent",
    suggestionBtn:
      "size-12 shrink-0 rounded-full bg-foreground text-background",
  },
});
