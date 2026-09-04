import { tv } from "tailwind-variants";

export const landingHeaderSectionStyles = tv({
  slots: {
    root: "pointer-events-none sticky top-4 z-20 px-4",
    bar: "pointer-events-auto relative z-40 mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-full border border-border bg-surface/80 px-2 pe-2 ps-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl",
    brand: "flex shrink-0 items-center gap-2 rounded-full pe-2",
    brandMark:
      "flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground",
    brandName: "font-brand text-sm font-normal tracking-normal text-foreground",
    desktopNav: "hidden items-center gap-1 lg:flex",
    desktopLink:
      "rounded-full px-3 py-2 text-sm text-muted transition-colors duration-300 landing-ease hover:text-foreground",
    actions: "flex items-center gap-2",
    ctaIcon:
      "flex size-6 items-center justify-center rounded-full bg-accent-foreground/10",
    menuButton: "lg:hidden",
    overlay:
      "pointer-events-auto fixed inset-0 z-30 bg-background/95 px-6 pt-24 backdrop-blur-xl transition-opacity duration-500 landing-ease lg:hidden",
    overlayOpen: "opacity-100",
    overlayClosed: "pointer-events-none opacity-0",
    mobileNav: "flex flex-col gap-2",
    mobileLink: "rounded-2xl px-3 py-4 text-2xl font-semibold text-foreground",
    mobileCta: "mt-6",
    mobileCtaIcon:
      "flex size-8 items-center justify-center rounded-full bg-accent-foreground/10",
  },
});
