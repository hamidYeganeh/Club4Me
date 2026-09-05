import { tv } from "tailwind-variants";

export const landingFaqSectionStyles = tv({
  slots: {
    root: "mt-3 flex justify-center rounded-(--radius-card-lg) bg-background px-5 py-16 sm:px-10 sm:py-24",
    inner: "flex w-full max-w-[800px] flex-col items-center",
    label: "mb-5 text-center text-[26px] font-normal leading-none text-muted",
    title: [
      "mb-10 w-full text-center text-balance text-[28px] font-semibold leading-[34px]",
      "tracking-tight text-foreground sm:mb-[60px] md:text-[44px] md:leading-[48px]",
    ].join(" "),
    list: "flex w-full flex-col gap-5",
    item: [
      "overflow-hidden rounded-[1.25rem] border border-transparent",
      "bg-surface-secondary transition-all duration-moderate ease-app",
      "has-[[aria-expanded=true]]:border-border",
      "has-[[aria-expanded=true]]:bg-surface",
    ].join(" "),
    trigger: [
      "group flex h-auto min-h-[72px] w-full cursor-pointer items-center",
      "justify-between gap-3 px-4 py-5 text-start select-none",
      "hover:bg-transparent data-[hovered=true]:bg-transparent",
      "sm:px-[26px] md:h-[88px] md:min-h-[88px] md:py-0",
    ].join(" "),
    heading: "flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1",
    question:
      "text-[18px] font-medium leading-[28px] tracking-tight text-foreground sm:text-[20px] sm:leading-[30px]",
    number: "text-[14px] font-normal tracking-tight text-muted",
    plus: [
      "size-6 shrink-0 text-foreground transition-transform duration-moderate ease-app",
      "group-aria-expanded:rotate-45",
    ].join(" "),
    body: [
      "text-base leading-[1.6] text-muted",
      "[&_.accordion__body-inner]:px-4 sm:[&_.accordion__body-inner]:px-[26px]",
      "[&_.accordion__body-inner]:pt-5",
      "[&_.accordion__body-inner]:pb-[26px]",
    ].join(" "),
  },
});
