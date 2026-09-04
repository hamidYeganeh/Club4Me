import { tv } from "tailwind-variants";

export const reservationsHeaderSectionStyles = tv({
  slots: {
    root: "fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-xl border-b border-white/7 bg-background/78 px-5 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_12px_32px_color-mix(in_oklch,var(--background)_55%,transparent)] backdrop-blur-xl",
    spacer: "h-[calc(78px+env(safe-area-inset-top)+5.6rem)] w-full shrink-0",
    bar: "flex h-19.5 items-center gap-3",
    back: "app-icon-button border-none",
    title: "text-xl leading-none font-bold text-foreground",
    dates: "flex snap-x snap-mandatory flex-nowrap gap-2.5 pb-1",
    dateButton:
      "flex h-auto min-h-[4.85rem] w-[3.4rem] min-w-[3.4rem] snap-start flex-col gap-1 rounded-[1rem] border border-white/8 px-0 py-2.5 shadow-none transition-transform duration-200 active:scale-95",
    weekday: "text-[0.7rem] leading-none font-medium",
    day: "text-[1.35rem] leading-none font-bold",
    dot: "mt-0.5 size-1.5 rounded-full",
  },
  variants: {
    selected: {
      true: {
        dateButton: "bg-foreground text-background",
        weekday: "text-muted",
        day: "text-background",
        dot: "bg-background/70",
      },
      false: {
        dateButton:
          "bg-surface-secondary text-foreground hover:bg-surface-tertiary",
        weekday: "text-muted",
        day: "text-foreground",
        dot: "bg-foreground/30",
      },
    },
  },
});
