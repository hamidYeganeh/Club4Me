import { tv } from "tailwind-variants";

export const accountAuthLoginFormStyles = tv({
  slots: {
    root: "mt-8 flex w-full max-w-md flex-col self-stretch",
    fieldset: "gap-6",
    group: "flex w-full flex-col gap-4",
    field: "flex w-full flex-col gap-2",
    label: "text-sm font-bold text-foreground",
    inputGroup:
      "h-12 rounded-2xl border border-border bg-surface shadow-none",
    prefix: "ps-3 text-muted",
    suffix: "pe-1",
    input: "min-w-0 flex-1 text-start text-base",
    meta: "flex w-full flex-col items-start gap-3",
    remember: "gap-2 text-sm leading-5 text-foreground",
    forgot: "px-0 py-0",
    actions: "mt-2 w-full",
    button: "active:scale-[0.98]",
  },
});
