import { tv } from "tailwind-variants";

export const accountAuthOtpCopySectionStyles = tv({
  slots: {
    root: "flex w-full max-w-md flex-col items-start text-start",
    title:
      "text-[1.75rem] font-bold leading-snug tracking-tight text-foreground",
    subtitle: "mt-3 max-w-[28rem] text-sm leading-6 text-muted",
  },
});
