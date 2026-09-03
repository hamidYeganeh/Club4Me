import { tv } from "tailwind-variants";

export const panelRailSectionStyles = tv({
  slots: {
    root: "flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 py-3 lg:h-dvh lg:w-[4.75rem] lg:flex-col lg:border-b-0 lg:border-e lg:px-2 lg:py-5",
    add: "size-11 rounded-[1.15rem] bg-accent text-accent-foreground",
    nav: "flex flex-1 items-center justify-center gap-1 lg:flex-col lg:gap-2",
    item: "flex size-11 items-center justify-center rounded-2xl text-muted transition-colors duration-200 hover:bg-surface-secondary hover:text-foreground",
    itemActive: "bg-accent/15 text-accent",
    avatarWrap: "shrink-0",
  },
});
