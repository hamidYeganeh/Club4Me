import { tv } from "tailwind-variants";

export const splashScreenStyles = tv({
  slots: {
    root: "fixed inset-0 z-[200] flex h-dvh w-full items-center justify-center bg-accent transition-opacity duration-500 ease-out motion-reduce:transition-none",
  },
  variants: {
    visible: {
      true: {
        root: "opacity-100",
      },
      false: {
        root: "pointer-events-none opacity-0",
      },
    },
  },
  defaultVariants: {
    visible: true,
  },
});
