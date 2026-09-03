import { tv } from "tailwind-variants";

export const homeHeroSectionStyles = tv({
  slots: {
    root: "relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16",
    toggle: "absolute start-6 top-6",
    title: "text-3xl font-semibold text-foreground",
    description: "text-muted max-w-md text-center",
    meta: "text-sm text-muted",
  },
});
