import { tv } from "tailwind-variants";

export const landingClassesSectionStyles = tv({
  slots: {
    root: "mt-3 rounded-(--radius-card-lg) bg-background px-5 py-16 sm:px-10 sm:py-24",
    header: "mx-auto mb-14 max-w-2xl text-center",
    title:
      "text-[32px] font-bold leading-tight tracking-tight text-foreground md:text-[42px]",
    hint: "mt-4 text-sm text-muted md:text-base",
    rail: [
      "flex justify-start gap-5 overflow-x-auto pb-2",
      "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      "md:flex-wrap md:justify-center",
    ].join(" "),
    card: "shrink-0",
    ctaWrap: "mt-12 flex justify-center",
    cta: [
      "h-auto rounded-full bg-accent px-8 py-4 text-base font-semibold",
      "text-accent-foreground transition-opacity duration-moderate ease-app hover:opacity-90",
    ].join(" "),
  },
});
