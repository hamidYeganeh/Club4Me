import { tv } from "tailwind-variants";

export const athletePlaceholderFeedSectionStyles = tv({
  slots: {
    root: "grid grid-flow-dense grid-cols-2 gap-3",
    item: "app-stack-card app-surface relative h-32 overflow-hidden rounded-[1.6rem] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2.4s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/4 before:to-transparent",
  },
});
