import { tv } from "tailwind-variants";

export const dashboardAsideSectionStyles = tv({
  slots: {
    root: "flex w-full flex-col gap-4 lg:w-[20rem] lg:shrink-0",
    profile: "rounded-[1.75rem] border border-border bg-surface p-5",
    hello: "text-sm text-muted",
    name: "text-xl font-semibold",
    promo:
      "overflow-hidden rounded-[1.75rem] bg-surface-tertiary p-5 text-surface-tertiary-foreground",
    promoList: "mt-3 space-y-2 text-sm",
    calendar: "rounded-[1.75rem] border border-border bg-surface p-5",
    week: "mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted",
    days: "mt-2 grid grid-cols-7 gap-1",
    day: "flex size-8 items-center justify-center rounded-full text-xs",
    dayOn: "bg-accent text-accent-foreground",
    legend: "mt-4 flex flex-wrap gap-3 text-[11px] text-muted",
  },
});
