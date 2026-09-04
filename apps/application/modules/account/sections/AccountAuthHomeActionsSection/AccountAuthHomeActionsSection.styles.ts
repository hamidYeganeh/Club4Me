import { tv } from "tailwind-variants";

export const accountAuthHomeActionsSectionStyles = tv({
  slots: {
    root: "flex w-full max-w-full flex-col items-center gap-3 self-stretch sm:self-center",
    primary: "h-16 active:scale-[0.98]",
    secondary: "h-16 active:scale-[0.98]",
  },
});
