import { tv } from "tailwind-variants";

export const landingBlogsSectionStyles = tv({
  slots: {
    root: "mt-3 w-full overflow-hidden rounded-(--radius-card-lg) bg-background py-20 md:py-28",
    inner: "landing-container px-5 sm:px-6",
    header: "mb-12 flex flex-col items-center text-center",
    heading: [
      "mx-auto mb-4 max-w-[672px] text-[32px] font-medium leading-[40px]",
      "tracking-tight text-foreground md:text-[40px] md:leading-[48px]",
    ].join(" "),
    sub: "mb-8 max-w-[700px] text-base leading-6 text-muted",
    cta: [
      "inline-flex items-center gap-1.5 text-base font-semibold",
      "text-accent no-underline transition-opacity duration-moderate ease-app hover:opacity-80",
    ].join(" "),
    rail: [
      "flex justify-start gap-4 overflow-x-auto pb-1",
      "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      "md:flex-wrap md:justify-center",
    ].join(" "),
    card: "w-[min(19rem,82vw)] shrink-0",
  },
});
