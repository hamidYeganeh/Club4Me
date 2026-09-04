import { tv } from "tailwind-variants";

export const accountAuthOtpFormStyles = tv({
  slots: {
    root: "mt-12 flex w-full shrink-0 flex-col max-[700px]:mt-10",
    fieldset: "gap-6",
    group: "w-full",
    field: "w-full",
    inputGroup: "h-16 w-full rounded-2xl border border-border bg-surface shadow-none",
    input: "min-w-0 flex-1 px-4 text-start text-xl font-medium tracking-wide",
  },
});
