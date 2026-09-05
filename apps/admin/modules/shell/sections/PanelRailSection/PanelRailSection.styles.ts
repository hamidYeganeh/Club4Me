import { tv } from "tailwind-variants";

export const panelRailSectionStyles = tv({
  slots: {
    root: "z-40 flex shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-surface/75 px-3 py-3 backdrop-blur-2xl lg:sticky lg:top-0 lg:h-dvh lg:w-[5.25rem] lg:flex-col lg:border-b-0 lg:border-e lg:px-3 lg:py-5",
    add: "size-11 rounded-2xl bg-accent text-accent-foreground hover:-translate-y-0.5",
    nav: "flex flex-1 items-center justify-start gap-1 overflow-x-auto lg:w-full lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:py-2",
    item: "flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-all duration-200 hover:bg-surface-secondary hover:text-foreground",
    itemActive: "bg-accent/12 text-accent",
    avatarWrap: "shrink-0",
  },
});
