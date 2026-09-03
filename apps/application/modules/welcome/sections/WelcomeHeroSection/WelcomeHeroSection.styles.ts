import { tv } from "tailwind-variants";

export const welcomeHeroSectionStyles = tv({
  slots: {
    root: "relative min-h-[46dvh] w-full flex-1 overflow-hidden",
    image: "object-cover object-[center_18%]",
    fade: "pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-linear-to-t from-background from-20% via-background/70 to-transparent",
  },
});
