import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const articleCardVariants = tv({
  slots: {
    root: [
      "group relative flex overflow-hidden rounded-[24px]",
      "border-0 bg-surface text-start text-foreground shadow-none",
      "outline-none transition-[transform,box-shadow,background-color] duration-fast ease-app",
      "data-[pressable=true]:cursor-pointer",
      "data-[pressable=true]:hover:-translate-y-0.5",
      "data-[pressable=true]:hover:shadow-[0_16px_40px_-24px_rgb(0_0_0_/_0.35)]",
      "data-[pressable=true]:active:scale-[0.985]",
      "data-[pressable=true]:focus-visible:ring-2 data-[pressable=true]:focus-visible:ring-accent",
    ].join(" "),
    cover: "relative shrink-0 overflow-hidden bg-background",
    coverImage:
      "pointer-events-none absolute inset-0 size-full object-cover select-none",
    overlay: "absolute inset-0 z-10 flex items-start justify-between gap-3 p-3",
    badge: [
      "h-7 max-w-[70%] rounded-full border-0 px-3",
      "shadow-[0_4px_16px_rgb(0_0_0_/_0.12)]",
      "[--chip-bg:var(--snow)] [--chip-fg:var(--eclipse)]",
      "[&_.chip__label]:truncate [&_.chip__label]:text-xs [&_.chip__label]:font-semibold",
    ].join(" "),
    bodyBadge: [
      "h-7 w-fit max-w-[70%] rounded-full border-0 px-3",
      "[&_.chip__label]:truncate [&_.chip__label]:text-xs [&_.chip__label]:font-semibold",
    ].join(" "),
    menuButton: [
      "size-9 min-w-9 shrink-0 rounded-full",
      "bg-transparent text-foreground shadow-none",
      "hover:bg-transparent data-[hovered=true]:bg-transparent",
      "data-[pressed=true]:bg-transparent data-[pressed=true]:scale-[0.96]",
    ].join(" "),
    menuIcon: "size-5 shrink-0",
    body: "flex min-w-0 flex-1 flex-col",
    author: "flex min-w-0 items-center gap-2",
    avatar: "size-7 shrink-0",
    authorMeta: "flex min-w-0 items-center text-muted",
    authorItem: "inline-flex min-w-0 items-center gap-1.5",
    authorItemText: "min-w-0 truncate",
    authorDot: "text-muted/70",
    title: "min-w-0 tracking-tight text-foreground",
    excerpt: "min-w-0 text-muted",
    footer: "mt-auto flex min-w-0 items-center gap-3",
    tags: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5",
    tag: [
      "inline-flex h-auto min-h-0 max-w-full items-center gap-1.5",
      "rounded-md bg-transparent p-0 text-muted shadow-none",
      "hover:bg-transparent data-[hovered=true]:bg-transparent",
      "data-[pressed=true]:bg-transparent data-[pressed=true]:scale-[0.98]",
    ].join(" "),
    tagIconWrap: "inline-flex shrink-0",
    tagIcon: "size-3.5 shrink-0 text-muted",
    tagLabel: "truncate text-sm",
  },
  variants: {
    orientation: {
      vertical: {
        root: "w-full flex-col",
        cover: "aspect-[4/3] w-full",
        body: "gap-3 p-5",
        title: "line-clamp-2 text-xl font-bold leading-snug",
        excerpt: "line-clamp-2 text-sm leading-6",
      },
      horizontal: {
        root: "w-full flex-row items-stretch gap-4 p-4",
        cover: "aspect-square w-[7.5rem] rounded-[1.25rem] sm:w-32",
        overlay: "hidden",
        body: "justify-between gap-2 py-0.5 pe-0.5",
        title: "line-clamp-2 text-base font-bold leading-snug sm:text-lg",
        excerpt: "line-clamp-2 text-sm leading-5",
      },
    },
    type: {
      cover: {},
      text: {
        cover: "hidden",
        overlay: "hidden",
        root: "flex-col p-5",
        body: "gap-3 p-0",
        title: "line-clamp-3 text-xl font-bold leading-snug sm:text-2xl",
        excerpt: "line-clamp-2 text-sm leading-6",
      },
    },
  },
  defaultVariants: {
    orientation: "vertical",
    type: "cover",
  },
});

export type ArticleCardVariantProps = VariantProps<typeof articleCardVariants>;
