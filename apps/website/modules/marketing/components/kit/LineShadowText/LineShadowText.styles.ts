import { tv } from "tailwind-variants";

export const lineShadowTextVariants = tv({
  slots: {
    root: [
      "relative z-0 inline-flex",
      "after:absolute after:top-[0.04em] after:left-[0.04em] after:content-[attr(data-text)]",
      "after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)]",
      "after:-z-10 after:bg-size-[0.06em_0.06em] after:bg-clip-text after:text-transparent",
      "after:animate-line-shadow",
    ],
  },
});
