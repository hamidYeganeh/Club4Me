import { tv } from "tailwind-variants";

export const landingPathSectionStyles = tv({
  slots: {
    root: "scroll-mt-28 px-4 py-24 md:py-32",
    inner: "mx-auto max-w-6xl",
    title:
      "max-w-[16ch] text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
    list: "mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8",
    item: "relative",
    card: "flex flex-col items-start",
    icon: "flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground",
    heading: "mt-6 text-xl font-semibold text-foreground",
    copy: "mt-2 max-w-[32ch] text-sm leading-relaxed text-muted",
  },
});
