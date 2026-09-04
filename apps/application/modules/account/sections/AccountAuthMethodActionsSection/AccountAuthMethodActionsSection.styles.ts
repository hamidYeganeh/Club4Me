import { tv } from "tailwind-variants";

export const accountAuthMethodActionsSectionStyles = tv({
  slots: {
    root: "mt-6 mb-2 flex w-full shrink-0 flex-col gap-3",
    submit: "h-16 w-full active:scale-[0.98]",
    divider: "flex w-full items-center gap-3",
    rule: "h-px flex-1 bg-separator",
    caption: "shrink-0",
    alternate: "h-16 w-full active:scale-[0.98]",
  },
});
