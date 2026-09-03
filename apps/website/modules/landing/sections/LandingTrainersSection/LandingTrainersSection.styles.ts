import { tv } from "tailwind-variants";

export const landingTrainersSectionStyles = tv({
  slots: {
    root: "scroll-mt-28 bg-surface px-4 py-24 md:py-32",
    inner: "mx-auto max-w-6xl",
    title:
      "max-w-[16ch] text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
    grid: "mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10",
    featured: "lg:col-span-7",
    featuredCard: "rounded-[1.75rem] border border-border bg-surface-secondary p-1.5",
    featuredInner: "overflow-hidden rounded-[1.25rem] bg-background",
    featuredMedia: "relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]",
    featuredBody: "flex flex-col gap-4 p-6 md:p-8",
    featuredName: "text-2xl font-semibold text-foreground",
    featuredRole: "mt-1 text-sm text-accent",
    featuredBio: "max-w-[46ch] text-sm leading-relaxed text-muted",
    ctaIcon:
      "flex size-7 items-center justify-center rounded-full bg-accent-foreground/10",
    list: "flex flex-col justify-center gap-4 lg:col-span-5",
    item: "flex gap-4 rounded-[1.5rem] border border-border bg-background p-2",
    itemMedia:
      "relative size-28 shrink-0 overflow-hidden rounded-[1rem] sm:size-32",
    itemBody: "flex min-w-0 flex-col justify-center py-2 pe-3",
    itemName: "text-lg font-semibold text-foreground",
    itemRole: "mt-0.5 text-sm text-accent",
    itemBio: "mt-2 text-sm leading-relaxed text-muted",
  },
});
