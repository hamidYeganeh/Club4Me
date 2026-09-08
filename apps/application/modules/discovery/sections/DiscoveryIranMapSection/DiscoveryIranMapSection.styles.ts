import { tv } from "tailwind-variants";

export const discoveryIranMapSectionStyles = tv({
  slots: {
    root: "app-reveal flex shrink-0 flex-col gap-4",
    header: "",
    card: "w-full",
    content: "flex w-full flex-col",
    mapWrap: "relative w-full overflow-hidden",
    map: "block aspect-[720/510] h-auto w-full overflow-visible",
    province:
      "cursor-pointer stroke-background/80 transition-[fill-opacity,stroke,filter] duration-200 outline-none hover:fill-opacity-100 hover:stroke-accent focus-visible:fill-opacity-100 focus-visible:stroke-accent focus-visible:[filter:drop-shadow(0_0_5px_color-mix(in_oklch,var(--accent)_55%,transparent))]",
    detail:
      "flex min-h-24 items-center justify-between gap-4 pt-3",
    detailCopy: "min-w-0",
    detailLabel: "text-xs font-medium text-muted",
    detailTitle: "mt-1 truncate text-xl font-black text-foreground",
    detailValue: "mt-1 text-sm text-muted",
    action:
      "flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-accent/12 px-4 text-sm font-bold text-accent transition-[background-color,transform] hover:bg-accent/18 active:scale-[0.97] sm:mt-2 sm:w-full",
    source:
      "flex items-center justify-between gap-3 pt-2 text-[0.68rem] leading-5 text-muted",
  },
});
