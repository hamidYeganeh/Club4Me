import { tv } from "tailwind-variants";

export const panelHeaderSectionStyles = tv({
  slots: {
    root: "sticky top-0 z-30 flex min-h-18 items-center gap-3 rounded-b-4xl bg-surface px-4 pt-[max(.75rem,env(safe-area-inset-top))] pb-3 lg:rounded-t-[1.75rem] lg:px-6",
    menuBtn: "app-icon-button size-11 lg:hidden",
    search:
      "min-w-0 flex-1 sm:min-w-[12rem] lg:mx-auto lg:max-w-md lg:flex-none",
    actions: "flex items-center gap-2",
    iconBtn: "app-icon-button",
    notifyBtn:
      "app-icon-button bg-accent text-accent-foreground hover:bg-accent/90 border-transparent",
    drawerDialog: "app-surface w-[min(90vw,22rem)] max-w-full border-s border-white/7 bg-surface/90",
    drawerNav: "flex flex-col gap-1",
    drawerItem:
      "flex w-full items-center gap-3 min-h-12 rounded-2xl px-3 py-3 text-sm text-muted transition-colors duration-200 hover:bg-surface-secondary/80 hover:text-foreground",
    drawerItemActive: "bg-accent/15 text-accent",
    drawerAdd:
      "mb-2 flex w-full items-center gap-3 rounded-[1.15rem] bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground",
  },
});
