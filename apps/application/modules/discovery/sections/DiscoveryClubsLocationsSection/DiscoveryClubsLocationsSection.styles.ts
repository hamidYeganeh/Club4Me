import { tv } from "tailwind-variants";

export const discoveryClubsLocationsSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    scroller: "-mx-5 overflow-x-auto px-5",
    track: "flex w-max snap-x snap-mandatory flex-nowrap gap-3 pb-1",
    card: "w-[9.75rem] snap-start sm:w-[11.5rem]",
  },
});
