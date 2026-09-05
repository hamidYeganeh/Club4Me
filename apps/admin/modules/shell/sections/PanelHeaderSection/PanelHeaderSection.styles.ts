import { tv } from "tailwind-variants";

export const panelHeaderSectionStyles = tv({
  slots: {
    root: "sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-2xl lg:px-6",
    search: "min-w-[12rem] flex-1",
    actions: "flex items-center gap-2",
    iconBtn:
      "size-10 rounded-xl border border-border/80 bg-surface/80 text-foreground shadow-sm hover:border-accent/35 hover:bg-surface-secondary",
  },
});
