import { tv } from "tailwind-variants";

export const landingClubsSectionStyles = tv({
  slots: {
    root: "mt-3 rounded-(--radius-card-lg) bg-background px-5 py-16 sm:px-10 sm:py-24",
    title:
      "text-balance text-3xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-5xl",
    hint: "mt-4 max-w-xl text-sm text-muted",
    grid: [
      "mt-14 flex gap-4 overflow-x-auto pb-2",
      "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      "md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4",
    ],
    card: "w-[11.5rem] shrink-0 md:w-full",
  },
});
