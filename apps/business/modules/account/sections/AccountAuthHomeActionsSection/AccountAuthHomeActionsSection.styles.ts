import { tv } from "tailwind-variants";

export const accountAuthHomeActionsSectionStyles = tv({
  slots: {
    root: "mt-8 flex w-full max-w-md flex-col gap-4 self-stretch",
    primary: "h-14 rounded-full text-base font-bold active:scale-[0.98]",
    secondary:
      "h-14 rounded-full border border-border bg-surface text-base font-bold text-foreground active:scale-[0.98]",
  },
});
