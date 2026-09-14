import { tv } from "tailwind-variants";

export const accountAuthHomeActionsSectionStyles = tv({
  slots: {
    root: "mt-8 flex w-full max-w-md flex-col gap-4 self-stretch",
    primary: "h-14 rounded-full text-base font-bold",
    secondary:
      "h-14 rounded-full bg-surface text-base font-bold text-foreground",
  },
});
