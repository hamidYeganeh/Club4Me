import { tv } from "tailwind-variants";

export const profileEditGeneralSectionStyles = tv({
  slots: {
    root: "flex flex-1 flex-col bg-surface px-5 pb-10 pt-7",
    heading: "mb-5 flex items-center gap-2",
    headingIcon: "text-foreground",
    list: "flex flex-col gap-5",
    field: "flex w-full flex-col gap-2",
    label: "text-sm font-bold text-foreground",
    row: "flex h-14 w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 text-start text-base text-foreground shadow-none outline-none transition-colors hover:bg-surface-secondary/70 focus-visible:ring-2 focus-visible:ring-focus",
    value: "min-w-0 flex-1 truncate",
    empty: "text-muted",
    suffix: "ms-auto shrink-0 text-muted",
    phoneGroup:
      "h-14 rounded-2xl border border-border bg-surface shadow-none",
    phonePrefix: "gap-1.5 ps-3 pe-2 text-foreground",
    phoneSeparator: "h-6 bg-border",
    phoneInput: "min-w-0 flex-1 text-start text-base tracking-wide",
    phoneTrigger: "flex h-8 min-h-8 w-auto items-center gap-1 border-0 bg-transparent px-0 shadow-none",
    flag: "size-5 overflow-hidden rounded-sm",
  },
});
