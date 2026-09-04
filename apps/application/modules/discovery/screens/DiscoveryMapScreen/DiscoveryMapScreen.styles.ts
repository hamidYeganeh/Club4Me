import { tv } from "tailwind-variants";

export const discoveryMapScreenStyles = tv({
  slots: {
    root: "relative isolate flex h-full min-h-full w-full flex-col overflow-hidden",
    mapWrap: "relative min-h-0 flex-1",
    map: "absolute inset-0 h-full min-h-0 rounded-none",
    status:
      "absolute inset-x-4 top-4 z-10 rounded-2xl border border-foreground/10 bg-background/90 px-4 py-3 text-center shadow-lg backdrop-blur-md",
    empty:
      "pointer-events-none absolute inset-x-4 top-4 z-10 rounded-2xl border border-foreground/10 bg-background/90 px-4 py-3 text-center text-sm text-muted shadow-lg backdrop-blur-md",
    retry: "mt-2",
    rail: "absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4",
    railHeader: "flex items-center justify-between px-5",
    scroller:
      "flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    card: "w-[min(82vw,22rem)] shrink-0 rounded-[1.6rem]",
    cardSelected: "ring-2 ring-accent",
  },
});
