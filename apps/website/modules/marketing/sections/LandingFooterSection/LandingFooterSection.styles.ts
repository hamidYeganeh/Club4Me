import { tv } from "tailwind-variants";

export const landingFooterSectionStyles = tv({
  slots: {
    root: [
      "landing-dark mt-3 rounded-(--radius-card-lg) bg-(--brand-deep)",
      "px-6 py-14 text-(--on-brand) sm:px-10 sm:py-16",
    ],
    ctaBand:
      "flex flex-col gap-8 border-b border-(--glass-border) pb-14 sm:flex-row sm:items-end sm:justify-between",
    ctaTitle:
      "mt-4 text-balance text-4xl font-bold leading-[0.92] tracking-tight sm:text-5xl lg:text-6xl",
    columns: "grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]",
    brandCol: "max-w-80",
    brandRow:
      "flex items-center gap-2 text-lg font-bold tracking-[0.18em] uppercase",
    blurb: "mt-4 text-sm text-(--on-brand-muted)",
    address:
      "mt-6 text-sm text-(--on-brand) opacity-80 not-italic [&_a]:transition-opacity [&_a]:duration-fast [&_a]:ease-app hover:[&_a]:opacity-70",
    addrMuted: "opacity-55",
    colTitle:
      "text-xs font-bold tracking-[0.2em] text-(--on-brand) opacity-50 uppercase",
    colList:
      "mt-4 space-y-3 text-sm text-(--on-brand) opacity-80 [&_a]:transition-opacity [&_a]:duration-fast [&_a]:ease-app hover:[&_a]:opacity-70",
    bottom: [
      "flex flex-col gap-5 border-t border-(--glass-border) pt-8 text-sm text-(--on-brand-muted)",
      "pb-[max(0px,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between",
    ],
    social:
      "flex gap-5 [&_a]:transition-opacity [&_a]:duration-fast [&_a]:ease-app hover:[&_a]:opacity-70",
    legal:
      "flex gap-5 [&_a]:transition-opacity [&_a]:duration-fast [&_a]:ease-app hover:[&_a]:opacity-70",
  },
});
