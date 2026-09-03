import { tv } from "tailwind-variants";

export const landingJoinSectionStyles = tv({
  slots: {
    root: "scroll-mt-28 px-4 py-24 md:py-28",
    card: "mx-auto max-w-6xl rounded-[2rem] bg-accent px-6 py-14 text-accent-foreground md:px-14 md:py-16",
    title: "max-w-[16ch] text-3xl font-semibold tracking-tight md:text-5xl",
    subtitle:
      "mt-4 max-w-[40ch] text-base leading-relaxed text-accent-foreground/80",
    cta: "mt-8 bg-accent-foreground text-accent hover:bg-accent-foreground/90",
    ctaIcon: "flex size-8 items-center justify-center rounded-full bg-accent/20",
  },
});
