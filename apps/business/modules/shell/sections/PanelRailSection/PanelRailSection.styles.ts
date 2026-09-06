import { tv } from "tailwind-variants";

export const panelRailSectionStyles = tv({
  slots: {
    root: [
      "z-40 flex shrink-0 items-center justify-between gap-3",
      "border-b border-border/60 bg-accent px-3 py-3 text-accent-foreground",
      "lg:sticky lg:top-3 lg:my-3 lg:ms-3 lg:h-[calc(100dvh-1.5rem)] lg:w-[4.5rem]",
      "lg:flex-col lg:rounded-[2rem] lg:border lg:border-accent/30 lg:px-2 lg:py-5",
      "lg:shadow-[0_18px_48px_-24px_oklch(0_0_0_/_0.45)]",
      "dark:bg-surface dark:text-foreground dark:border-white/8",
      "dark:lg:border-white/10",
    ].join(" "),
    add: [
      "size-11 rounded-[1.15rem] bg-accent-foreground text-accent shadow-none",
      "dark:bg-accent dark:text-accent-foreground",
    ].join(" "),
    nav: "flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto lg:w-full lg:flex-col lg:justify-center lg:gap-1.5 lg:overflow-visible",
    item: [
      "relative flex size-11 shrink-0 items-center justify-center rounded-[1rem]",
      "text-accent-foreground/70 transition-colors duration-200",
      "hover:bg-accent-foreground/10 hover:text-accent-foreground",
      "dark:text-muted dark:hover:bg-surface-secondary/80 dark:hover:text-foreground",
    ].join(" "),
    itemActive: [
      "bg-accent-foreground/15 text-accent-foreground",
      "dark:bg-accent/15 dark:text-accent",
    ].join(" "),
    activeMark:
      "pointer-events-none absolute start-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-full bg-accent-foreground lg:block dark:bg-accent",
    avatarWrap: "shrink-0",
    avatarBtn: [
      "rounded-[1rem] border border-accent-foreground/25 bg-accent-foreground/10 p-0",
      "dark:border-white/15 dark:bg-surface-secondary",
    ].join(" "),
  },
});
