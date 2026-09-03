import { tv } from "tailwind-variants";

export const discoveryClubsDetailStickyHeaderSectionStyles = tv({
  slots: {
    root: "fixed inset-x-0 top-0 z-30 bg-surface p-4 rounded-b-3xl pt-[max(1rem,env(safe-area-inset-top))] transition-all duration-300 ease-out",
    inner: "grid grid-cols-[auto_1fr_auto] items-center gap-3",
    title: "text-right",
    favoriteIcon: "text-danger",
  },
  variants: {
    visible: {
      true: {
        root: "translate-y-0 opacity-100",
      },
      false: {
        root: "pointer-events-none -translate-y-full opacity-0",
      },
    },
  },
  defaultVariants: {
    visible: false,
  },
});
