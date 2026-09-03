import { tv } from "tailwind-variants";

export const accountAuthHomeActionsSectionStyles = tv({
  slots: {
    root: "flex w-full max-w-sm flex-col items-center gap-3 self-stretch sm:self-center",
    primary: "active:scale-[0.98]",
    secondary: "active:scale-[0.98]",
  },
});
