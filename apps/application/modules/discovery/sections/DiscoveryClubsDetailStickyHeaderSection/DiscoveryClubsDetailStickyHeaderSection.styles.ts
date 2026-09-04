import { tv } from "tailwind-variants";

export const discoveryClubsDetailStickyHeaderSectionStyles = tv({
  slots: {
    root: "fixed inset-x-0 top-0 z-30 h-[calc(78px+env(safe-area-inset-top))] rounded-b-3xl bg-surface px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] transition-all duration-300 ease-out",
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
