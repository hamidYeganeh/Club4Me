import { tv } from "tailwind-variants";

export const discoveryClubsRailSectionStyles = tv({
  slots: {
    root: "relative isolate flex flex-col gap-4 overflow-hidden px-5 pt-5 pb-6",
    pattern:
      "pointer-events-none absolute inset-0 grid grid-cols-8 content-start gap-x-5 gap-y-6 px-2 py-3 text-[#24272c]/18",
    header: "relative z-[1]",
    scroller: "relative z-[1] -mx-5 overflow-x-auto px-5",
    track: "flex w-max snap-x snap-mandatory flex-nowrap gap-3 pb-1",
    card: "snap-start",
    skeleton: "shrink-0 rounded-[24px] border border-white/7 bg-surface/72",
    error: "relative z-[1] py-8 text-center",
    errorText: "mb-3 text-danger",
  },
  variants: {
    tone: {
      accent: {
        root: "rounded-t-4xl bg-accent pb-10",
      },
      surface: {
        root: "bg-transparent px-0 pt-0 pb-0",
        scroller: "-mx-5 px-5",
      },
    },
    cardVariant: {
      compact: {
        skeleton: "aspect-[16/10] w-[min(90vw,360px)] min-w-[min(90vw,360px)]",
      },
      editorial: {
        skeleton: "aspect-[3/4] w-[min(78vw,320px)] min-w-[min(78vw,320px)]",
      },
    },
  },
  defaultVariants: {
    tone: "surface",
    cardVariant: "compact",
  },
});
