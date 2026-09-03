import { tv } from "tailwind-variants";

export const accountAuthMethodActionsSectionStyles = tv({
  slots: {
    root: "mt-2 flex w-full max-w-sm flex-col gap-3 self-stretch sm:self-center",
    submit: "active:scale-[0.98]",
    divider: "flex w-full items-center gap-3",
    rule: "h-px flex-1 bg-separator",
    caption: "shrink-0",
    alternate: "active:scale-[0.98]",
  },
});
