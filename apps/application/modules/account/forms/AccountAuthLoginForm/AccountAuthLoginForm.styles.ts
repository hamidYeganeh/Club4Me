import { tv } from "tailwind-variants";

export const accountAuthLoginFormStyles = tv({
  slots: {
    root: "mt-12 flex w-full shrink-0 flex-col max-[700px]:mt-10",
    fieldset: "gap-4",
    group: "flex w-full flex-col gap-3",
    field: "w-full",
    inputGroup:
      "h-16 w-full rounded-2xl border border-border bg-surface shadow-none",
    suffix: "pe-2",
    input: "min-w-0 flex-1 px-4 text-start text-xl font-medium tracking-wide",
    meta: "mt-1 flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2",
    remember: "gap-2 text-sm leading-5 text-foreground",
    forgot: "h-9",
  },
});
