import { tv } from "tailwind-variants";

export const accountAuthOtpFormStyles = tv({
  slots: {
    root: "mt-6 flex w-full max-w-md flex-col self-stretch",
    fieldset: "gap-8",
    group: "w-full",
    field: "w-full",
    inputGroup:
      "h-14 rounded-2xl border border-border bg-surface shadow-none",
    prefix:
      "gap-1.5 ps-3 pe-2 text-foreground",
    separator: "h-6 bg-border",
    input:
      "min-w-0 flex-1 text-start text-base tracking-wide",
    trigger: "w-auto gap-1 px-0 shadow-none",
    flag: "size-5 overflow-hidden rounded-sm",
    actions: "w-full",
    button: "active:scale-[0.98]",
  },
});
