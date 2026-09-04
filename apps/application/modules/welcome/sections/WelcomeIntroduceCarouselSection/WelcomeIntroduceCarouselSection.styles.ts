import { tv } from "tailwind-variants";

export const welcomeIntroduceCarouselSectionStyles = tv({
  slots: {
    root: "relative isolate h-dvh w-full overflow-hidden bg-background",
    glow: "pointer-events-none absolute -top-24 start-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl",
    stage: "absolute inset-0 z-10 overflow-hidden",
    swiper:
      "h-full w-full overflow-hidden [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full [&_.swiper-slide]:max-w-full",
    slide: "relative h-full w-full",
    image: "object-cover saturate-75 contrast-110",
    overlay: "absolute inset-0 bg-black/30",
    overlayBottom: "absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-background via-background/60 to-transparent",
    copy: "absolute inset-x-5 bottom-36 z-10 flex flex-col items-center px-5 py-5 text-center text-white",
    title: "w-full",
    subtitle: "mt-3 w-full",
    footer:
      "absolute inset-x-0 bottom-0 z-20 h-[7.5rem] rounded-t-[2.5rem] border-t border-white/7 bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl",
    navNext:
      "absolute top-4 left-5 z-30 flex size-12 items-center justify-center rounded-[1.1rem] bg-accent text-accent-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--accent)_35%,transparent)] transition-transform duration-200 ease-out active:scale-95",
    navPrev:
      "absolute top-4 right-5 z-30 flex size-12 items-center justify-center rounded-[1.1rem] bg-surface-secondary text-foreground shadow-lg transition-transform duration-200 ease-out active:scale-95",
    pagination:
      "absolute top-6 right-20 left-20 z-20 flex items-center justify-center",
    bullet: "flex h-8 w-8 items-center justify-center",
    bulletBar: "h-1 transition-[width,background-color] duration-200 ease-out",
    bulletActive: "w-7 bg-accent",
    bulletInactive: "w-3.5 bg-foreground/20",
  },
});
