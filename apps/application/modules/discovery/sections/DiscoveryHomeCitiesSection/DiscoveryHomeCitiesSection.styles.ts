import { tv } from "tailwind-variants";

export const discoveryHomeCitiesSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    carousel: "w-full",
    swiper: "w-full",
    slide: "!w-auto",
    card: "w-[9.75rem] sm:w-[11.5rem]",
  },
});
