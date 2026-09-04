import { tv } from "tailwind-variants";

export const athleteScreenHeaderSectionStyles = tv({
  slots: {
    root: "app-header justify-between",
    spacer: "app-header-spacer",
    title: "truncate text-[1.4rem] tracking-tight",
  },
});
