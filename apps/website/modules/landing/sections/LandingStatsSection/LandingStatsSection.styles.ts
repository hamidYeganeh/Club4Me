import { tv } from "tailwind-variants";

export const landingStatsSectionStyles = tv({
  slots: {
    root: "border-y border-separator bg-surface",
    grid: "mx-auto grid max-w-6xl grid-cols-1 px-4 sm:grid-cols-3",
    item: "border-t border-separator px-2 py-10 first:border-t-0 sm:border-s sm:border-t-0 sm:py-12 sm:first:border-s-0 sm:first:ps-0",
    value: "text-4xl font-semibold tracking-tight text-accent md:text-5xl",
    label: "mt-2 text-sm text-muted",
  },
});
