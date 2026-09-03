import { tv } from "tailwind-variants";

export const dashboardAsideSectionStyles = tv({
  slots: {
    root: "flex w-full flex-col gap-5 rounded-[1.75rem] border border-border bg-surface p-5 lg:w-[20rem] lg:shrink-0",
    profile: "flex flex-col items-center text-center",
    name: "mt-3 text-lg font-semibold",
    role: "text-sm text-muted",
    stats: "mt-4 flex w-full justify-between text-xs text-muted",
    list: "flex flex-col gap-3",
    item: "flex items-center gap-3 rounded-2xl bg-surface-secondary px-3 py-3",
    itemIcon:
      "flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent",
    itemTitle: "text-sm font-medium",
    itemMeta: "text-xs text-muted",
    add: "mt-auto rounded-2xl border border-dashed border-accent/50 py-4 text-accent",
  },
});
