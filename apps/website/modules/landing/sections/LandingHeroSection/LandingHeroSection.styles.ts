import { tv } from "tailwind-variants";

export const landingHeroSectionStyles = tv({
  slots: {
    root: "relative mx-auto grid min-h-[100dvh] w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-8 lg:grid-cols-12 lg:gap-8 lg:pb-20 lg:pt-10",
    glow: "pointer-events-none absolute -start-24 top-24 size-[28rem] rounded-full bg-accent/15 blur-3xl",
    copy: "relative z-[1] flex flex-col items-start lg:col-span-6",
    kicker:
      "mb-4 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-muted",
    title:
      "max-w-[14ch] text-4xl font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-6xl",
    subtitle: "mt-5 max-w-[36ch] text-base leading-relaxed text-muted md:text-lg",
    actions: "mt-8 flex flex-wrap items-center gap-3",
    ctaIcon:
      "flex size-8 items-center justify-center rounded-full bg-accent-foreground/10",
    media: "relative z-[1] lg:col-span-6",
    mediaFrame: "rounded-[1.75rem] border border-border bg-surface-secondary p-1.5",
    mediaInner:
      "relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-surface sm:aspect-[5/6] lg:aspect-[4/5]",
  },
});
