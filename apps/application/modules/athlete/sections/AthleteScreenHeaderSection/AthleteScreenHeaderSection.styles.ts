import { tv } from "tailwind-variants";

export const athleteScreenHeaderSectionStyles = tv({
  slots: {
    root: "flex items-center justify-between",
    title: "text-2xl font-semibold text-foreground",
  },
});
