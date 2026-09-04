import { tv } from "tailwind-variants";

export const accountAuthOtpHeaderSectionStyles = tv({
  slots: {
    root: "app-header",
    spacer: "app-header-spacer",
    back: "app-icon-button",
  },
  variants: {
    overlay: {
      true: {
        root: "border-transparent bg-background/48 shadow-none",
        spacer: "hidden",
        back: "border-white/8 bg-background/58 backdrop-blur-xl",
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
