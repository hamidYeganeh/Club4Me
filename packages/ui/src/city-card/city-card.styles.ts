import { tv } from "tailwind-variants";

export const cityCardStyles = tv({
  slots: {
    root: "relative isolate aspect-[260/360] h-auto w-[260px] max-w-full shrink-0 gap-0 overflow-hidden rounded-[28px] border-none bg-surface p-0 shadow-none",
    image:
      "pointer-events-none absolute inset-0 size-full object-cover select-none",
    blur: "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[55%]",
    blurLayer: "absolute inset-0",
    fade: "absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent",
    content:
      "absolute inset-0 z-[2] flex flex-col justify-end gap-1 p-5 pe-6",
    label:
      "m-0 text-[11px] font-medium tracking-[0.08em] text-muted uppercase",
    title: "m-0 line-clamp-2 text-xl leading-6 font-bold text-foreground",
    link: "absolute inset-0 z-[1] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus",
  },
});
