import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const todoCardVariants = tv({
  slots: {
    root: [
      // Override HeroUI `.card` defaults (flex-col gap-3 p-4)
      "!flex !flex-col !gap-5 !p-4",
      "w-full overflow-hidden rounded-[24px] border-0",
      "bg-surface text-surface-foreground shadow-none",
    ].join(" "),
    header: "flex flex-col gap-3",
    stepLabel:
      "text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted",
    title:
      "text-balance text-xl font-bold leading-snug tracking-tight text-foreground",
    progress: "flex w-full gap-1.5",
    progressSegment: "h-1.5 min-w-0 flex-1 rounded-full",
    list: "flex w-full flex-col gap-0",
    divider: [
      "shrink-0 bg-separator",
      "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
    ].join(" "),
    row: [
      "flex h-auto w-full min-w-0 items-center justify-start gap-3 py-3.5 text-start",
      "rounded-none border-0 bg-transparent px-0 shadow-none outline-none",
      "transition-opacity duration-fast ease-app",
    ].join(" "),
    index: [
      "flex size-7 shrink-0 items-center justify-center rounded-full",
      "border border-border text-xs font-semibold tabular-nums text-foreground",
    ].join(" "),
    label: "min-w-0 flex-1 text-sm font-medium leading-snug text-foreground",
    check: [
      "flex size-6 shrink-0 items-center justify-center rounded-[0.375rem]",
      "border transition-colors duration-fast ease-app",
    ].join(" "),
  },
  variants: {
    segmentFilled: {
      true: {
        progressSegment: "bg-accent",
      },
      false: {
        progressSegment: "bg-surface-secondary",
      },
    },
    itemStatus: {
      completed: {
        check: "border-accent bg-accent text-accent-foreground",
      },
      pending: {
        check: "border-border bg-transparent text-transparent",
      },
    },
    interactive: {
      true: {
        row: ["cursor-pointer", "data-[pressed=true]:opacity-80"].join(" "),
      },
      false: {
        row: "cursor-default",
      },
    },
  },
  defaultVariants: {
    segmentFilled: false,
    itemStatus: "pending",
    interactive: false,
  },
});

export type TodoCardVariantProps = VariantProps<typeof todoCardVariants>;
