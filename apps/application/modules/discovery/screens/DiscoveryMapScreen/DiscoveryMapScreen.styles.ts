import { tv } from "tailwind-variants";

export const discoveryMapScreenStyles = tv({
  slots: {
    root: "relative isolate h-full min-h-full w-full overflow-hidden bg-background",
    header:
      "absolute inset-x-0 top-0 z-30 grid h-[calc(76px+env(safe-area-inset-top))] grid-cols-[3rem_1fr_3rem] items-end gap-3 bg-linear-to-t from-transparent via-background/70 to-background/95 px-5 pb-3 pt-[env(safe-area-inset-top)]",
    headerButton:
      "flex size-11 min-w-11 items-center justify-center rounded-2xl border border-border/60 bg-surface/85 text-foreground shadow-md backdrop-blur-md transition-transform active:scale-95",
    headerAction: "flex justify-end",
    title:
      "self-center truncate text-center text-lg font-bold text-foreground drop-shadow-sm",
    mapWrap: "absolute inset-0",
    map: "absolute inset-0 h-full min-h-0 rounded-none",
    status:
      "absolute inset-x-5 top-[calc(5.5rem+env(safe-area-inset-top))] z-20 rounded-2xl border border-border/60 bg-surface/90 px-4 py-3 text-center shadow-lg backdrop-blur-md",
    empty:
      "pointer-events-none absolute inset-x-5 top-[calc(5.5rem+env(safe-area-inset-top))] z-20 rounded-2xl border border-border/60 bg-surface/90 px-4 py-3 text-center text-sm text-muted shadow-lg backdrop-blur-md",
    retry: "mt-2",
    locate:
      "!right-5 !bottom-[calc(15rem+env(safe-area-inset-bottom))] !size-12 !border-border/60 !bg-surface/90 !text-accent backdrop-blur-md",
    rail: "absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
    card: "!aspect-auto !h-48 !w-full !rounded-[1.75rem] border border-border/60 shadow-2xl",
  },
});
