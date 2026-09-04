import { tv } from "tailwind-variants";

export const articleCardStyles = tv({
  slots: {
    root: "relative gap-0 overflow-hidden rounded-3xl bg-surface p-0 text-surface-foreground shadow-none",
    media:
      "relative isolate overflow-hidden bg-surface-secondary [background-image:repeating-conic-gradient(var(--surface-tertiary)_0%_25%,var(--surface)_0%_50%)] [background-size:1rem_1rem]",
    image: "absolute inset-0 size-full object-cover",
    badge:
      "absolute start-3 top-3 z-10 rounded-lg border-none bg-surface text-foreground shadow-[0_6px_16px_color-mix(in_oklch,var(--foreground)_12%,transparent)]",
    menu: "z-10 min-w-8 text-foreground",
    body: "flex min-w-0 flex-1 flex-col",
    author: "flex min-w-0 items-center gap-2",
    avatar: "size-6 shrink-0",
    authorName: "min-w-0",
    separator: "shrink-0 text-muted",
    readTime: "shrink-0",
    title:
      "line-clamp-2 min-h-[calc(1.375em*2)] overflow-hidden font-bold break-words text-foreground",
    description:
      "line-clamp-2 min-h-[calc(1.25rem*2)] overflow-hidden break-words text-muted",
    footer:
      "relative z-10 mt-auto flex min-h-6 items-end justify-between gap-3 p-0",
    tags: "flex min-w-0 flex-nowrap items-center gap-x-3 overflow-hidden",
    tag: "h-auto min-h-0 max-w-full shrink-0 gap-1.5 px-0 py-0 text-foreground",
    tagIcon: "shrink-0 text-accent",
    link: "absolute inset-0 z-[1] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus",
  },
  variants: {
    orientation: {
      vertical: {
        root: "flex h-full w-full max-w-sm flex-col gap-0 p-0",
        media: "aspect-[16/10] w-full shrink-0",
        menu: "absolute end-2 top-2",
        body: "gap-2.5 px-4 pt-3 pb-4",
        title: "text-lg leading-snug",
        description: "text-sm leading-5",
      },
      horizontal: {
        root: "flex h-full w-full flex-row items-stretch gap-3.5 p-3",
        media: "w-[7.75rem] min-w-[7.75rem] self-stretch rounded-2xl",
        menu: "relative shrink-0",
        body: "gap-2 py-0.5 pe-1",
        title: "text-lg leading-snug",
        description: "text-sm leading-5",
      },
    },
    outlined: {
      true: {
        root: "border border-border",
      },
      false: {
        root: "border border-transparent",
      },
    },
  },
  defaultVariants: {
    orientation: "vertical",
    outlined: false,
  },
});
