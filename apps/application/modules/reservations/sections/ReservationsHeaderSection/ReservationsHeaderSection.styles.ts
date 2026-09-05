import { tv } from "tailwind-variants";

export const reservationsHeaderSectionStyles = tv({
  slots: {
    root: "border-b border-white/7 bg-background/82 px-5 py-4 backdrop-blur-xl",
    calendar: "flex size-10 items-center justify-center text-foreground",
    dates: "flex snap-x snap-mandatory flex-nowrap gap-2 pb-1",
    dateButton:
      "group flex h-auto min-h-[4.55rem] w-[4.15rem] min-w-[4.15rem] snap-start flex-col items-center justify-center gap-1 rounded-[1.15rem] border border-transparent bg-surface-tertiary px-3 py-2.5 text-foreground shadow-none transition-[transform,border-color,background-color,color] duration-300 ease-out active:scale-95",
    weekday: "text-base leading-none font-medium text-muted transition-colors",
    day: "text-2xl leading-none font-black tracking-tight tabular-nums",
  },
  variants: {
    historyActive: {
      true: {
        calendar: "rounded-xl bg-accent text-accent-foreground",
      },
      false: {},
    },
    selected: {
      true: {
        dateButton: "border-foreground/80 bg-surface text-foreground",
        weekday: "text-foreground/75",
        day: "text-foreground",
      },
      false: {
        dateButton: "hover:scale-[1.03]",
        weekday: "text-muted",
        day: "text-foreground",
      },
    },
  },
});
