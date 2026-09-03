import { tv } from "tailwind-variants";

export const accountAuthOtpHeaderSectionStyles = tv({
  slots: {
    root: "flex w-full items-center self-stretch pb-2",
    back: "size-11 min-w-11",
  },
  variants: {
    overlay: {
      true: {
        back: "border-border/50 bg-background/55 backdrop-blur-md",
      },
    },
  },
  defaultVariants: {
    overlay: false,
  },
});
