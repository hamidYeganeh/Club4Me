import { tv } from "tailwind-variants";

export const discoveryClubsDetailActionsSectionStyles = tv({
  slots: {
    root: "pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-xl rounded-t-[2rem] border-t border-border bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
    inner: "pointer-events-auto flex items-center gap-3",
    bookWrap: "min-w-0 flex-1",
  },
});
