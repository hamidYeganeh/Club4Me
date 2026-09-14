import { tv } from "tailwind-variants";

export const reservationsHeaderSectionStyles = tv({
  slots: {
    root: "mx-4 mt-4 rounded-[2rem] bg-surface px-4 py-5",
    calendar: "flex size-11 items-center justify-center text-foreground",
    dates: "flex snap-x snap-mandatory flex-nowrap gap-2 pb-1",
    dateButton:
      "group flex h-auto min-h-[4.55rem] w-[4.15rem] min-w-[4.15rem] snap-start flex-col items-center justify-center gap-1 rounded-[1.15rem] bg-background px-3 py-2.5 text-foreground shadow-none transition-[transform,border-color,background-color,color] duration-300 ease-out",
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
        dateButton: "bg-accent text-accent-foreground",
        weekday: "text-accent-foreground",
        day: "text-accent-foreground",
      },
      false: {
        dateButton: "",
        weekday: "text-muted",
        day: "text-foreground",
      },
    },
  },
});
