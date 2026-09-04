import { tv } from "tailwind-variants";

export const discoveryCitiesProvinceSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    title: "text-foreground",
    carousel: "-mx-5 w-[calc(100%+2.5rem)] px-5",
    swiper: "w-full",
    slide: "!w-auto",
  },
});
