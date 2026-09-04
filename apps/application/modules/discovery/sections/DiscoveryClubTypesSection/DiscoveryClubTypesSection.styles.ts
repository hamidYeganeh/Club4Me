import { tv } from "tailwind-variants";

export const discoveryClubTypesSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    scroller: "-mx-5 overflow-x-auto px-5",
    track: "flex w-max snap-x snap-mandatory flex-nowrap gap-6 pb-1",
    column: "flex w-[11.25rem] shrink-0 snap-start flex-col gap-5",
    item: "relative flex w-full flex-row items-center gap-3 no-underline outline-none transition-transform duration-200 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-focus",
    iconWrap:
      "grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-foreground text-xl",
    body: "flex min-w-0 flex-1 flex-col gap-0.5 py-0.5",
    name: "leading-6 text-foreground",
    count: "leading-5",
    skeleton: "flex w-full flex-row items-center gap-3",
    skeletonIcon: "size-11 shrink-0 rounded-xl",
    skeletonText: "flex min-w-0 flex-1 flex-col gap-2",
    skeletonTitle: "h-4 w-24 rounded-md",
    skeletonCount: "h-3 w-16 rounded-md",
  },
});
