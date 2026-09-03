import { tv } from "tailwind-variants";

export const discoveryClubsDetailActionsSectionStyles = tv({
  slots: {
    root: "pointer-events-none fixed inset-x-0 bottom-0 z-20 px-5 pt-12 pb-[max(1rem,env(safe-area-inset-bottom))] bg-linear-to-t from-background from-35% via-background/80 to-transparent",
    inner: "pointer-events-auto flex items-center gap-3",
    bookWrap: "min-w-0 flex-1",
  },
});
