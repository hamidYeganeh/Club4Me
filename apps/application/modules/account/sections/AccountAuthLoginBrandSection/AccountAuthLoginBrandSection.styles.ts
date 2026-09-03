import { tv } from "tailwind-variants";

export const accountAuthLoginBrandSectionStyles = tv({
  slots: {
    root: "flex w-full max-w-sm flex-col items-center px-2 pt-2 text-center",
    image: "h-auto object-contain transition-[width] duration-300 ease-out",
    title: "mt-4",
    tagline: "mt-3 max-w-[18rem]",
  },
  variants: {
    compact: {
      true: {
        root: "pt-0",
        image: "w-[min(5.5rem,28%)]",
        title: "mt-2",
        tagline: "hidden",
      },
      false: {
        image: "w-[min(7.5rem,36%)]",
      },
    },
    showIllustration: {
      false: {
        root: "px-0 pt-0",
        title: "mt-0",
        tagline: "mt-3",
      },
    },
  },
  defaultVariants: {
    compact: false,
    showIllustration: true,
  },
});
