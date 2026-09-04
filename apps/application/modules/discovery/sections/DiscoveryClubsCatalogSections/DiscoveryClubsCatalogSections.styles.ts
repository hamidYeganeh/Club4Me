import { tv } from "tailwind-variants";

export const discoveryClubsCatalogSectionsStyles = tv({
  slots: {
    root: "-mx-5 flex flex-col",
    hero: "px-5",
    sheet:
      "relative z-[1] -mt-5 flex flex-col gap-8 rounded-t-2xl bg-background px-5 pt-6 pb-2",
  },
});
