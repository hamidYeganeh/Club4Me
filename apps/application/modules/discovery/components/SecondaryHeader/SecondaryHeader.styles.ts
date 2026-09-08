import { tv } from "tailwind-variants";

export const secondaryHeaderStyles = tv({
  slots: {
    root: [
      "fixed inset-x-0 top-0 z-40 mx-auto flex w-full max-w-xl items-center",
      "h-[calc(72px+var(--app-safe-top))] px-4 pb-3",
      "pt-[calc(var(--app-safe-top)+12px)]",
      "rounded-b-[2rem] bg-surface",
    ].join(" "),
    spacer: "app-header-spacer",
    inner: "relative flex w-full items-center",
    homeInner: "justify-center",
    pageInner: "gap-3",
    back: "app-icon-button bg-background",
    title:
      "min-w-0 flex-1 truncate text-start text-base font-bold tracking-tight text-foreground",
    trailing: "ms-auto flex shrink-0 items-center gap-1",
    filter: "app-icon-button bg-background",
    homeFilter:
      "app-icon-button absolute end-0 top-1/2 -translate-y-1/2 bg-background",
  },
});
