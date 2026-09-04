import { tv } from "tailwind-variants";

export const discoveryHomeCitiesSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    carousel: "w-full",
    swiper: "w-full",
    slide: "!w-auto",
    column: "flex w-[13.5rem] flex-col gap-4",
    card: "flex w-full flex-row items-center gap-3 bg-transparent p-0 shadow-none",
    imageWrap:
      "relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-surface-secondary",
    image: "object-cover",
    body: "flex min-w-0 flex-1 flex-col gap-0.5 py-0.5",
    label: "leading-5",
    city: "leading-6 text-foreground",
    count: "leading-5",
  },
});
