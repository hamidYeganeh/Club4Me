import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const quickActionCardVariants = tv({
  slots: {
    root: [
      "group !flex h-full w-full min-w-0 whitespace-normal shadow-none",
      "transition-transform duration-fast ease-app",
      "data-[pressed=true]:scale-[0.97]",
      "outline-none",
    ].join(" "),
    tile: [
      "flex shrink-0 items-center justify-center bg-default text-foreground",
      "transition-colors duration-fast ease-app",
      "group-data-[hovered=true]:bg-default/80",
      "group-data-[pressed=true]:bg-default/70",
    ].join(" "),
    icon: "inline-flex items-center justify-center text-foreground",
    label: "min-w-0 text-foreground",
  },
  variants: {
    layout: {
      tile: {
        root: [
          "min-h-0 flex-col items-stretch justify-start gap-2",
          "bg-transparent p-0",
          "hover:bg-transparent data-[hovered=true]:bg-transparent",
        ].join(" "),
        tile: "aspect-square w-full rounded-[22px]",
        icon: "[&_svg]:!size-7",
        label: [
          "block h-8 w-full px-0.5 text-center leading-tight",
          "line-clamp-2 overflow-hidden",
        ].join(" "),
      },
      row: {
        root: [
          "min-h-16 flex-row items-center justify-start gap-3",
          "rounded-[1.25rem] bg-surface p-3 text-start",
          "hover:bg-surface-secondary data-[hovered=true]:bg-surface-secondary",
        ].join(" "),
        tile: "size-11 rounded-[0.875rem]",
        icon: "[&_svg]:!size-5",
        label: "line-clamp-2 flex-1 overflow-hidden text-start leading-snug",
      },
    },
  },
  defaultVariants: { layout: "tile" },
});

export type QuickActionCardVariantProps = VariantProps<
  typeof quickActionCardVariants
>;
