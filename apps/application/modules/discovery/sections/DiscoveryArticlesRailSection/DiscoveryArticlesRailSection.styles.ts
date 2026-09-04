import { tv } from "tailwind-variants";

export const discoveryArticlesRailSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    swiper: "w-full [&_.swiper-wrapper]:items-stretch",
    slide: "h-auto! w-auto!",
    card: "h-full",
  },
  variants: {
    orientation: {
      vertical: {
        card: "w-[min(78vw,20rem)]",
      },
      horizontal: {
        card: "w-[min(92vw,26rem)]",
      },
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});
