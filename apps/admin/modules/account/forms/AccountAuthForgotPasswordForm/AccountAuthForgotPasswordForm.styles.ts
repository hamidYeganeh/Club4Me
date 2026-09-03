import { tv } from "tailwind-variants";

export const accountAuthForgotPasswordFormStyles = tv({
  slots: {
    root: "mt-6 flex w-full max-w-md flex-col self-stretch",
    fieldset: "gap-8",
    group: "w-full",
    field: "flex w-full flex-col gap-2",
    label: "text-sm font-bold text-foreground",
    inputGroup:
      "h-14 rounded-2xl border border-border bg-surface shadow-none",
    prefix: "ps-3 text-muted",
    input: "min-w-0 flex-1 text-start text-base tracking-wide",
    actions: "w-full",
    button: "active:scale-[0.98]",
  },
});
