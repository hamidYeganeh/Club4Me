import { tv } from "tailwind-variants";

export const landingSportsSectionStyles = tv({
  slots: {
    root: [
      "mt-3 overflow-hidden rounded-(--radius-card-lg) bg-background",
      "py-20 md:py-28",
    ].join(" "),
    headingWrap: "landing-container px-5",
    title: [
      "text-center text-[32px] font-medium leading-[40px] tracking-tight",
      "text-foreground md:text-[40px] md:leading-[46px]",
      "lg:text-[44px] lg:leading-[50px]",
    ].join(" "),
    hint: "mx-auto mt-4 max-w-xl text-center text-sm text-muted md:text-base",
    ctaWrap: "mt-8 flex justify-center",
    cta: [
      "h-auto rounded-full bg-foreground px-7 py-4 text-base font-normal",
      "leading-6 text-background transition-all duration-moderate ease-app",
      "hover:-translate-y-0.5 hover:bg-foreground/90",
      "data-[hovered=true]:bg-foreground/90",
    ].join(" "),
    marquee: "mt-16 space-y-5",
    row: "relative overflow-hidden",
    fadeStart: [
      "pointer-events-none absolute top-0 bottom-0 left-0 z-10",
      "w-[80px] bg-gradient-to-r from-background to-transparent md:w-[150px]",
    ].join(" "),
    fadeEnd: [
      "pointer-events-none absolute top-0 bottom-0 right-0 z-10",
      "w-[80px] bg-gradient-to-l from-background to-transparent md:w-[150px]",
    ].join(" "),
    track: "flex gap-4 py-2.5 md:gap-5",
    card: "shrink-0",
  },
});
