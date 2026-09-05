import { tv } from "tailwind-variants";

export const landingHeroSectionStyles = tv({
  slots: {
    root: [
      "landing-dark relative isolate flex min-h-[28rem] flex-col overflow-hidden",
      "rounded-(--radius-card-lg) text-(--on-brand)",
      "h-auto min-h-[calc(100svh-1rem)] md:h-[calc(100svh-1.5rem)] md:min-h-[36rem]",
    ],
    plate: "absolute inset-0 -z-10",
    plateInner:
      "absolute inset-x-0 top-[-16%] h-[132%] w-full will-change-transform",
    plateImg: "size-full object-cover",
    plateGradient: [
      "absolute inset-0",
      "bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--brand-deep)_65%,transparent),color-mix(in_oklab,var(--brand-deep)_35%,transparent),color-mix(in_oklab,var(--brand-deep)_75%,transparent))]",
    ],
    header:
      "relative z-20 flex items-start px-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-xs sm:px-10 sm:pt-8",
    navLeft: "hidden flex-1 gap-8 lg:flex",
    navLink:
      "text-(--on-brand) opacity-90 transition-opacity duration-fast ease-app hover:opacity-100",
    brand:
      "flex flex-1 items-center justify-center gap-2 text-base font-medium tracking-[0.2em] uppercase",
    navRight: "flex flex-1 items-center justify-end gap-4 sm:gap-5",
    themeToggle:
      "size-10 min-w-10 rounded-full border-0 bg-(--glass-fill) text-(--on-brand) backdrop-blur transition-opacity duration-moderate ease-app hover:opacity-90",
    bookBtn:
      "hidden font-medium tracking-wide underline-offset-4 transition-opacity duration-fast ease-app hover:underline sm:inline",
    burger:
      "grid size-11 place-items-center gap-[5px] rounded-full bg-(--glass-fill) backdrop-blur transition-opacity duration-moderate ease-app hover:bg-(--glass-border)",
    burgerBar: "block h-px w-4 bg-(--on-brand)",
    titleWrap:
      "relative z-10 flex flex-1 items-center justify-center px-5 text-center sm:px-10",
    title: ["text-center text-balance text-[clamp(2rem,11vw,6rem)] font-bold"],
    bottom: [
      "relative z-10 mt-auto flex flex-col gap-6 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
      "sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pb-10",
    ],
    tagline:
      "max-w-[20ch] text-balance text-[clamp(1.15rem,5.4vw,2.4rem)] font-medium leading-snug tracking-tight text-(--on-brand-muted) sm:max-w-none sm:leading-[0.95]",
    slider: "hidden w-[min(37.5rem,calc(100vw-4rem))] shrink-0 md:block",
    carouselShadow: "w-full max-w-none",
    carousel: "overflow-hidden",
    carouselTrack: "flex touch-pan-y gap-3",
    /** 2.5 cards: (100% − 2×gap-3) / 2.5 */
    slide: "min-w-0 shrink-0 basis-[calc((100%-1.5rem)/2.5)]",
    clubCard: "w-full max-w-none",
  },
});
