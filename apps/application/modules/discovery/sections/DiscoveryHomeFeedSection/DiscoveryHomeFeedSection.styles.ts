import { tv } from "tailwind-variants";

export const discoveryHomeFeedSectionStyles = tv({
  slots: {
    root: "grid grid-cols-2 gap-3",
            item: "flex min-w-0 flex-col gap-2",
    imageWrap:
      "relative aspect-square overflow-hidden rounded-2xl bg-surface-secondary",
    image: "object-cover",
    name: "px-0.5",
    meta: "px-0.5",
    rating: "font-medium text-foreground",
  },
});
