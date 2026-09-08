import { tv } from "tailwind-variants";

export const welcomeHeroSectionStyles = tv({
  slots: {
    root: "app-scroll-media relative h-[44dvh] min-h-64 w-full overflow-hidden rounded-3xl",
    image: "object-cover object-[center_18%] saturate-75 contrast-110",
    fade: "absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-background to-transparent",
  },
});
