import { tv } from "tailwind-variants";

export const discoveryCitiesProvinceSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-3",
    header: "flex items-center justify-between gap-3 px-1",
    title: "text-base font-bold text-foreground",
    count: "text-xs text-muted",
    rail: "-mx-4 overflow-x-auto snap-x snap-proximity px-4",
    list: "flex w-max gap-3 py-1",
    card: "w-[9.75rem] shrink-0 snap-start sm:w-[11.5rem]",
  },
});
