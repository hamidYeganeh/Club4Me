import { tv } from "tailwind-variants";

export const discoveryClubsEditorialListSectionStyles = tv({
  slots: {
    root: "flex flex-col gap-4",
    list: "flex flex-col gap-4",
    card: "w-full max-w-none",
    skeleton:
      "aspect-[3/4] w-full rounded-[24px] border border-border/40 bg-surface/72",
    error: "py-8 text-center",
    errorText: "mb-3 text-danger",
  },
});
