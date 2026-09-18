import { tv } from "tailwind-variants";

export const accountAuthHomeActionsSectionStyles = tv({
  slots: {
    root: "mt-8 flex w-full max-w-md flex-col gap-4 self-stretch",
    primary: "h-14 rounded-full text-base font-semibold",
    secondary:
      "h-14 rounded-full border border-border bg-surface text-base font-semibold text-foreground",
  },
});
