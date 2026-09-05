import { tv } from "tailwind-variants";

export const landingStatsSectionStyles = tv({
  slots: {
    root: [
      "landing-dark mt-3 rounded-(--radius-card-lg) bg-(--brand-deep)",
      "px-6 py-20 text-(--on-brand) sm:px-10",
    ],
    layout: [
      "flex flex-col items-stretch gap-12",
      "lg:flex-row lg:items-end lg:justify-between lg:gap-16",
    ],
    copy: "max-w-xl shrink-0",
    title:
      "mt-4 text-balance text-3xl font-medium leading-[0.95] tracking-tight sm:text-5xl",
    hint: "mt-4 max-w-xl text-sm text-(--on-brand-muted)",
    stack: "flex w-full max-w-[380px] flex-col gap-3 self-center lg:self-end",
    item: "w-full min-w-0",
    card: "w-full",
  },
});
