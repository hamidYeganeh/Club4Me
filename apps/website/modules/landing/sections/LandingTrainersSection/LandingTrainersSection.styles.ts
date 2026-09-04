import { tv } from "tailwind-variants";

export const landingTrainersSectionStyles = tv({
  slots: {
    root: "scroll-mt-28 bg-surface px-4 py-24 md:py-32",
    inner: "mx-auto max-w-6xl",
    title:
      "max-w-[16ch] text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
    grid: "mt-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8",
    featured: "lg:shrink-0",
    featuredCard: "w-full sm:w-[276px]",
    list: "flex flex-wrap gap-4",
    item: "w-full sm:w-[260px]",
  },
});
