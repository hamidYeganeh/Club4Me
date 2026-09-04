import { tv } from "tailwind-variants";

export const discoveryHomeFeedSectionStyles = tv({
  slots: {
    root: "grid grid-flow-dense grid-cols-2 gap-3",
    item: "group app-stack-card flex min-w-0 flex-col gap-2 last:odd:col-span-2",
    imageWrap:
      "relative aspect-square overflow-hidden rounded-[1.45rem] border border-white/7 bg-surface-secondary",
    image:
      "object-cover saturate-75 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:saturate-100",
    name: "px-0.5",
    meta: "px-0.5",
    rating: "font-medium text-foreground",
  },
});
