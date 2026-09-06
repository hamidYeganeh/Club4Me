import { tv } from "tailwind-variants";

export const discoveryClubsCardsSectionStyles = tv({
  slots: {
    root: "flex min-w-0 flex-col gap-4",
    stage:
      "overflow-hidden rounded-3xl border border-border/50 bg-surface/40 px-10 pt-6 pb-10",
    swiper:
      "w-full max-w-[320px] [--swiper-pagination-color:var(--accent)] [--swiper-pagination-bullet-inactive-color:var(--muted)] [--swiper-pagination-bottom:-28px]",
    slide: "rounded-3xl bg-surface",
    card: "w-full max-w-full",
    skeleton:
      "mx-auto w-full max-w-[320px] rounded-3xl shadow-[8px_0_0_0_var(--surface),16px_0_0_0_var(--border)]",
  },
});
