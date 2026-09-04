import { tv } from "tailwind-variants";

export const discoveryClubsScreenStyles = tv({
  slots: {
    root: "app-page gap-6",
    resultsBar: "app-reveal flex items-center justify-between",
    list: "flex flex-col gap-3",
    status: "py-12 text-center",
    empty: "py-16 text-center text-sm text-muted",
    error: "text-sm text-danger",
    retry: "mt-4",
  },
});
