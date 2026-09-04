import { tv } from "tailwind-variants";

export const secondaryHeaderStyles = tv({
  slots: {
    root: [
      "fixed inset-x-0 top-0 z-40 mx-auto flex w-full max-w-xl items-center",
      "h-[calc(72px+env(safe-area-inset-top))] px-5 pb-3",
      "pt-[calc(env(safe-area-inset-top)+12px)]",
      "rounded-b-4xl bg-surface",
    ].join(" "),
    spacer: "app-header-spacer",
    inner: "relative flex w-full items-center",
    homeInner: "justify-center",
    pageInner: "gap-3",
    back: "flex size-10 shrink-0 items-center justify-center text-foreground transition-transform active:scale-95",
    title:
      "min-w-0 flex-1 truncate text-start text-base font-bold tracking-tight text-foreground",
    trailing: "ms-auto flex shrink-0 items-center gap-1",
    filter:
      "flex size-10 items-center justify-center text-foreground transition-transform active:scale-95",
    homeFilter:
      "absolute end-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-foreground transition-transform active:scale-95",
  },
});
