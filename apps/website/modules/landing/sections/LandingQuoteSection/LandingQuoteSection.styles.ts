import { tv } from "tailwind-variants";

export const landingQuoteSectionStyles = tv({
  slots: {
    root: "bg-surface-secondary px-4 py-24 md:py-32",
    inner: "mx-auto max-w-3xl",
    quote:
      "mt-6 text-2xl font-semibold leading-[1.45] tracking-tight text-foreground md:text-3xl",
    footer: "mt-8",
    name: "font-medium text-foreground",
    role: "mt-1 text-sm text-muted",
  },
});
