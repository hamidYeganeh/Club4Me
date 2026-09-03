import { tv } from "tailwind-variants";

export const accountAuthOtpHeroSectionStyles = tv({
  slots: {
    root: "relative flex w-full items-center justify-center",
    image: "h-auto object-contain transition-[width] duration-300 ease-out",
  },
  variants: {
    size: {
      default: {
        root: "min-h-36 flex-1 py-4",
        image: "w-[min(13rem,52%)]",
      },
      compact: {
        root: "py-3",
        image: "w-[min(7.5rem,36%)]",
      },
    },
  },
  defaultVariants: {
    size: "default",
  },
});
