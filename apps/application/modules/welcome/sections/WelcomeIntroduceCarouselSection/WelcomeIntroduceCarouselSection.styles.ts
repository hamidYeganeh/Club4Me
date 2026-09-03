import { tv } from "tailwind-variants";

export const welcomeIntroduceCarouselSectionStyles = tv({
  slots: {
    root: "relative isolate h-dvh w-full overflow-hidden bg-background",
    glow: "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[58%] bg-[radial-gradient(ellipse_70%_58%_at_50%_78%,color-mix(in_oklch,var(--accent)_28%,transparent)_0%,transparent_72%)]",
    stage: "absolute inset-0 z-10 overflow-hidden",
    swiper:
      "h-full w-full overflow-hidden [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full [&_.swiper-slide]:max-w-full",
    slide: "relative h-full w-full",
    image: "object-cover",
    overlay:
      "pointer-events-none absolute inset-0 bg-linear-to-b from-background from-0% via-background/75 via-[28%] to-background/35",
    overlayBottom:
      "pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-linear-to-t from-background from-20% via-background/70 to-transparent",
    copy: "relative z-10 flex w-full flex-col items-center px-6 pt-[max(2.75rem,env(safe-area-inset-top))] text-center",
    title: "w-full",
    subtitle: "mt-3 w-full",
    footer:
      "absolute inset-x-0 bottom-0 z-20 h-[7.25rem] rounded-t-[2rem] bg-background pb-[env(safe-area-inset-bottom)]",
    navNext:
      "absolute top-5 left-6 z-30 flex size-14 items-center justify-center rounded-full border-0 bg-foreground text-background transition-transform duration-200 ease-out active:scale-95",
    navPrev:
      "absolute top-5 right-6 z-30 flex size-14 items-center justify-center rounded-full border-0 bg-foreground text-background transition-transform duration-200 ease-out active:scale-95",
    pagination:
      "absolute top-7 right-24 left-24 z-20 flex items-center justify-center",
    bullet: "flex h-8 w-8 items-center justify-center",
    bulletBar:
      "h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out",
    bulletActive: "w-7 bg-accent",
    bulletInactive: "w-3.5 bg-foreground/20",
  },
});
