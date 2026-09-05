import { tv } from "tailwind-variants";

export const accountAuthOtpHeaderSectionStyles = tv({
  slots: {
    root: "app-header justify-start",
    spacer: "app-header-spacer",
    back: "app-icon-button",
  },
  variants: {
    overlay: {
      true: {
        root: "pointer-events-none border-transparent bg-transparent shadow-none backdrop-blur-none",
        spacer: "hidden",
        back: "pointer-events-auto border-white/8 bg-surface/72 text-foreground backdrop-blur-xl",
      },
    },
    transparent: {
      true: {
        root: "bg-transparent backdrop-blur-none",
      },
    },
  },
  defaultVariants: {
    overlay: false,
    transparent: false,
  },
});
