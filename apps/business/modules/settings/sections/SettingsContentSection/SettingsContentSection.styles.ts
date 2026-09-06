import { tv } from "tailwind-variants";

export const settingsContentSectionStyles = tv({
  slots: {
    root: "flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:p-6",
    rail: [
      "flex w-full shrink-0 flex-col gap-4 rounded-[1.75rem] border border-border/60",
      "bg-surface/70 p-4 lg:w-[17.5rem] dark:bg-surface/40",
    ].join(" "),
    brand: "flex items-center gap-2 px-1 text-lg font-semibold tracking-tight",
    brandMark:
      "grid size-9 place-items-center rounded-[0.9rem] bg-accent text-accent-foreground",
    search:
      "flex items-center gap-2 rounded-[1.15rem] border border-border/70 bg-background/80 px-3 py-2.5",
    nav: "flex flex-col gap-1",
    navItem:
      "flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-secondary/80 hover:text-foreground",
    navItemActive: "bg-accent/12 font-medium text-accent",
    navBadge:
      "ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground",
    promo:
      "relative mt-auto rounded-[1.25rem] bg-danger/10 p-4 text-sm text-foreground",
    promoClose: "absolute end-2 top-2 text-muted",
    userRow: "flex items-center gap-3 border-t border-border/60 pt-4",
    stage: "min-w-0 flex-1",
    panel:
      "overflow-hidden rounded-[1.75rem] border border-border/60 bg-surface/80 dark:bg-surface/40",
    cover: "relative h-44 overflow-hidden",
    coverImage: "size-full object-cover",
    edit: "app-icon-button absolute end-4 top-4",
    identity:
      "relative -mt-12 flex flex-wrap items-end justify-between gap-4 px-5 pb-2",
    person: "flex items-end gap-4",
    name: "text-2xl font-semibold",
    email: "text-sm text-muted",
    actions: "flex gap-2",
    body: "space-y-5 p-5 pt-2",
    card: "rounded-[1.35rem] border border-border/50 bg-background/70 p-5 dark:bg-surface-secondary/40",
    grid: "mt-5 grid gap-4 md:grid-cols-2",
    field:
      "flex items-center gap-3 rounded-[1.15rem] border border-border/60 bg-surface/80 px-4 py-3",
    payout:
      "mt-4 flex items-center justify-between rounded-[1.15rem] border border-border/60 bg-surface/80 px-4 py-3",
  },
});
