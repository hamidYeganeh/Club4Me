import { tv } from "tailwind-variants";

export const accountAuthSetPasswordFormStyles = tv({
  slots: {
    root: "mt-12 flex w-full shrink-0 flex-col max-[700px]:mt-10",
    fieldset: "gap-5",
    group: "flex w-full flex-col gap-4",
    passwordBlock: "flex w-full flex-col gap-2.5",
    field: "w-full",
    inputGroup:
      "h-16 w-full rounded-2xl border border-border bg-surface shadow-none",
    suffix: "pe-2",
    input: "min-w-0 flex-1 px-4 text-start text-xl font-medium tracking-wide",
    strength: "w-full px-1",
    actions: "mt-2 w-full",
    button: "h-16 w-full active:scale-[0.98]",
  },
});
