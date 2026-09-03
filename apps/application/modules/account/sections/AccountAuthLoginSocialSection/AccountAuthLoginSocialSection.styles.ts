import { tv } from "tailwind-variants";

export const accountAuthLoginSocialSectionStyles = tv({
  slots: {
    root: "mt-8 flex w-full max-w-sm flex-col items-center gap-5 self-stretch sm:self-center",
    divider: "flex w-full items-center gap-3",
    rule: "h-px flex-1 bg-separator",
    caption: "shrink-0",
    list: "flex items-center justify-center gap-4",
    button: "shadow-none",
  },
});
