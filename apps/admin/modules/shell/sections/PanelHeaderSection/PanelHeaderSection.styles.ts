import { tv } from "tailwind-variants";

export const panelHeaderSectionStyles = tv({
  slots: {
    root: "flex flex-wrap items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-6",
    search: "min-w-[12rem] flex-1",
    actions: "flex items-center gap-2",
    iconBtn:
      "size-10 rounded-full border border-border bg-surface text-foreground",
  },
});
