import { tv } from "tailwind-variants";

export const landingProgramsSectionStyles = tv({
  slots: {
    root: "scroll-mt-28 px-4 py-24 md:py-32",
    inner: "mx-auto max-w-6xl",
    title:
      "max-w-[16ch] text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
    grid: "mt-12 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-2",
    card: "h-full rounded-[1.75rem] border border-border bg-surface-secondary p-1.5",
    body: "flex flex-col justify-end gap-3 p-5 md:p-6",
    icon: "flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground",
    heading: "text-xl font-semibold text-foreground",
    copy: "max-w-[42ch] text-sm leading-relaxed text-muted",
    media: "relative",
    layout: "overflow-hidden rounded-[1.25rem] bg-surface",
  },
  variants: {
    layout: {
      featured: {
        media: "relative aspect-[16/11] lg:aspect-auto lg:min-h-[22rem] lg:flex-1",
        layout: "flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-surface",
      },
      wide: {
        media: "relative aspect-[16/10] md:aspect-auto md:min-h-[14rem]",
        layout:
          "grid h-full overflow-hidden rounded-[1.25rem] bg-surface md:grid-cols-2",
      },
      default: {
        media: "relative aspect-[16/10]",
        layout: "flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-surface",
      },
    },
  },
  defaultVariants: {
    layout: "default",
  },
});
