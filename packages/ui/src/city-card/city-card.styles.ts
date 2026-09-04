import { tv } from "tailwind-variants";

export const cityCardStyles = tv({
  slots: {
    root: "relative isolate aspect-[3/4] h-auto w-[9.75rem] max-w-full shrink-0 gap-0 overflow-hidden rounded-[1.25rem] border-none bg-surface p-0 shadow-none sm:w-[11.5rem]",
    image:
      "pointer-events-none absolute inset-0 size-full object-cover select-none",
    blur: "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[58%]",
    blurLayer: "absolute inset-0",
    fade: "absolute inset-0 bg-gradient-to-t from-background from-15% via-background/70 to-transparent",
    content:
      "absolute inset-0 z-[2] flex flex-col justify-end gap-0.5 p-3.5 pe-4",
    label: "m-0 text-[11px] font-medium leading-4 text-muted",
    title:
      "m-0 line-clamp-2 text-base leading-5 font-bold text-foreground sm:text-lg sm:leading-6",
    link: "absolute inset-0 z-[3] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus",
  },
});
