import { tv } from "tailwind-variants";

export const accountAuthOtpCopySectionStyles = tv({
  slots: {
    root: "flex w-full shrink-0 flex-col items-center gap-3 px-1 text-center",
    title: "mt-0 text-balance",
    subtitle:
      "relative mx-auto max-w-full text-balance text-sm leading-snug text-foreground/80",
  },
  variants: {
    cue: {
      true: {
        subtitle:
          "after:absolute after:top-full after:left-1/2 after:h-12 after:w-px after:-translate-x-1/2 after:bg-linear-to-b after:from-transparent after:to-foreground after:content-[''] max-[700px]:after:h-10",
      },
      false: {
        subtitle: "",
      },
    },
  },
  defaultVariants: {
    cue: true,
  },
});
