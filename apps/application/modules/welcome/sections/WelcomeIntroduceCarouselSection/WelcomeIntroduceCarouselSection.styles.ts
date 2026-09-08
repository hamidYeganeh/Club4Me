import { tv } from "tailwind-variants";

export const welcomeIntroduceCarouselSectionStyles = tv({
  slots: {
    root: "relative isolate h-[calc(100dvh-8rem)] min-h-[34rem] w-full overflow-hidden rounded-3xl bg-background",
    glow: "pointer-events-none absolute -top-24 start-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl",
    stage: "absolute inset-0 z-10 overflow-hidden",
    swiper:
      "h-full w-full overflow-hidden [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full [&_.swiper-slide]:max-w-full",
    slide: "relative h-full w-full",
    image: "object-cover saturate-75 contrast-110",
    overlay: "absolute inset-0 bg-black/30",
    overlayBottom: "absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-background via-background/60 to-transparent",
    copy: "absolute inset-x-5 bottom-32 z-10 flex flex-col items-center px-5 py-5 text-center text-white",
    title: "w-full text-2xl font-extrabold leading-10 text-white",
    subtitle: "mt-3 w-full text-sm leading-7 !text-white/90",
    footer:
      "absolute inset-x-0 bottom-0 z-20 h-[7.5rem] rounded-t-[2.5rem] border-t border-white/7 bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl",
    navNext:
      "absolute top-4 left-5 z-30 flex size-12 items-center justify-center rounded-[1.1rem] bg-accent text-accent-foreground transition-transform duration-200 ease-out active:scale-95",
    navPrev:
      "absolute top-4 right-5 z-30 flex size-12 items-center justify-center rounded-[1.1rem] bg-surface-secondary text-foreground disabled:opacity-30 transition-transform duration-200 ease-out active:scale-95",
    pagination:
      "absolute top-6 right-20 left-20 z-20 flex items-center justify-center",
    bullet: "flex h-8 w-8 items-center justify-center",
    bulletBar: "h-1 transition-[width,background-color] duration-200 ease-out",
    bulletActive: "w-7 bg-accent",
    bulletInactive: "w-3.5 bg-foreground/20",
  },
});
