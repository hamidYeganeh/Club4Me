import { tv } from "tailwind-variants";

export const discoveryCityScreenStyles = tv({
  slots: {
    root: "relative min-h-dvh w-full max-w-full overflow-x-hidden bg-transparent pb-[calc(6.25rem+env(safe-area-inset-bottom))]",
    hero: "app-scroll-media relative isolate h-[43dvh] min-h-[22rem] overflow-hidden bg-surface",
    heroImage: "object-cover saturate-75 contrast-110",
    heroOverlay:
      "absolute inset-0 bg-linear-to-t from-background via-black/35 to-black/10",
    topBar:
      "absolute inset-x-0 top-0 z-10 flex justify-end px-5 pt-[max(1.25rem,env(safe-area-inset-top))]",
    backButton:
      "size-13 rounded-[1.15rem] border border-white/15 bg-black/30 text-white shadow-lg backdrop-blur-xl",
    heroCopy:
      "absolute inset-x-0 bottom-11 z-10 flex flex-col gap-3 px-5",
    eyebrow:
      "w-fit rounded-full border border-accent/60 bg-black/35 px-3 py-1.5 text-accent backdrop-blur-md",
    heroTitle: "text-[2rem] leading-[1.25] text-white",
    heroDescription: "max-w-sm text-sm leading-7 text-white/70",
    sheet:
      "relative z-20 -mt-7 min-h-[60dvh] rounded-t-[2.25rem] border-t border-white/7 bg-background/94 px-5 pt-7 backdrop-blur-xl",
    sheetHeader: "mb-5 flex items-center justify-between gap-3",
    list: "flex flex-col gap-3",
    card: "app-card app-stack-card group relative flex min-h-27 flex-row items-center gap-4 overflow-hidden p-3 shadow-none active:scale-[0.985]",
    imageWrap:
      "relative size-22 shrink-0 overflow-hidden rounded-[1.15rem] bg-surface-tertiary",
    image:
      "object-cover saturate-75 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:saturate-100",
    cardBody: "flex min-w-0 flex-1 flex-col gap-1",
    cardTitle: "text-lg text-foreground",
    count: "text-sm text-muted",
    countNumber: "font-bold text-accent",
    arrow:
      "grid size-9 shrink-0 place-items-center rounded-full bg-surface-tertiary text-foreground",
    cardLink:
      "absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus",
    empty: "py-20 text-center text-muted",
  },
});
