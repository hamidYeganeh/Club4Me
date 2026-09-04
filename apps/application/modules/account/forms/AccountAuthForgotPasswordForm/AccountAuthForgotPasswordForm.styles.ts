import { tv } from "tailwind-variants";

export const accountAuthForgotPasswordFormStyles = tv({
  slots: {
    root: "mt-2 flex w-full max-w-sm flex-col self-stretch sm:self-center",
    fieldset: "gap-8",
    group: "w-full",
    field: "flex w-full flex-col gap-2",
    label: "text-sm font-bold text-foreground",
    inputGroup: "h-16 rounded-2xl border border-border bg-surface shadow-none",
    prefix: "ps-3 text-muted",
    input: "min-w-0 flex-1 text-start text-xl font-medium tracking-wide",
    actions: "w-full",
    button: "active:scale-[0.98]",
  },
});
