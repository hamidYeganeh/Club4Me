import { tv } from "tailwind-variants";

export const reminderCardStyles = tv({
  slots: {
    root: [
      "relative flex w-full items-center gap-4 rounded-[1.6rem] border border-accent/20 bg-accent p-4",
      "text-accent-foreground shadow-[0_14px_38px_color-mix(in_oklch,var(--accent)_20%,transparent)]",
      "outline-none",
      "focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    ].join(" "),
    iconBox:
      "flex size-12 shrink-0 items-center justify-center rounded-[1rem] bg-accent-foreground/10",
    icon: "text-accent-foreground",
    content: "flex min-w-0 flex-1 flex-col gap-0.5",
    date: "truncate text-base font-bold leading-snug text-accent-foreground",
    time: "truncate text-sm font-medium leading-snug text-accent-foreground/85",
    meta: "truncate text-xs font-medium leading-snug text-accent-foreground/65",
    chevron: "shrink-0 text-accent-foreground rtl:rotate-180",
  },
  variants: {
    interactive: {
      true: {
        root: "cursor-pointer transition-transform active:scale-[0.99]",
      },
      false: {
        root: "cursor-default",
      },
    },
  },
  defaultVariants: {
    interactive: false,
  },
});
