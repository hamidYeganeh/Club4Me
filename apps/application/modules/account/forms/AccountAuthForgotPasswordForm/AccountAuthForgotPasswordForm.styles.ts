import { tv } from "tailwind-variants";

export const accountAuthForgotPasswordFormStyles = tv({
  slots: {
    root: "mt-12 flex w-full shrink-0 flex-col max-[700px]:mt-10",
    fieldset: "gap-4",
    group: "w-full",
    field: "w-full",
    inputGroup: "h-16 w-full rounded-2xl border border-border bg-surface shadow-none",
    input: "min-w-0 flex-1 px-4 text-start text-xl font-medium tracking-wide",
    actions: "mt-6 w-full",
    button: "h-16 w-full active:scale-[0.98]",
  },
});
