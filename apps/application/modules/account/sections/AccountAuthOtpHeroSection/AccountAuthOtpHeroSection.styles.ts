import { tv } from "tailwind-variants";

export const accountAuthOtpHeroSectionStyles = tv({
  slots: {
    root: "relative flex w-full shrink-0 items-center justify-center",
    image: "h-auto max-h-full object-contain transition-[width,max-height] duration-300 ease-out",
  },
  variants: {
    size: {
      default: {
        root: "max-h-[min(28vh,14rem)] py-3 max-[700px]:max-h-[min(22vh,10rem)]",
        image: "w-[min(11rem,48%)] max-[700px]:w-[min(8.5rem,42%)]",
      },
      compact: {
        root: "max-h-[min(16vh,7.5rem)] py-2",
        image: "w-[min(6.5rem,32%)]",
      },
    },
  },
  defaultVariants: {
    size: "default",
  },
});
