import { tv } from "tailwind-variants";

export const landingDownloadSectionStyles = tv({
  slots: {
    /**
     * Pin target — no overflow/rounding here (breaks ScrollSmoother pins).
     * High z-index keeps following sections from painting over the transform pin.
     */
    root: "landing-download relative z-30 mt-3 w-full min-h-0 py-4 md:min-h-svh",
    panel: [
      "relative flex h-full items-center overflow-hidden",
      "rounded-(--radius-card-lg) bg-accent px-5 py-14 text-accent-foreground",
      "sm:px-10 sm:py-20",
    ].join(" "),
    inner:
      "mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16",
    copy: "relative z-10 flex flex-col items-start text-start max-lg:order-2",
    title: [
      "text-3xl font-medium leading-[0.98] tracking-tight text-balance text-accent-foreground",
      "sm:text-5xl lg:text-6xl",
    ].join(" "),
    hint: "mt-3 max-w-md text-sm text-accent-foreground/75 sm:mt-4",
    actions:
      "mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center",
    store: [
      "group h-auto w-full justify-center gap-3 rounded-full",
      "bg-foreground px-6 py-3.5 text-background",
      "transition-opacity duration-moderate ease-app hover:opacity-90",
      "sm:w-auto sm:min-w-[11.5rem]",
    ].join(" "),
    storeGhost: [
      "group h-auto w-full justify-center gap-3 rounded-full",
      "border border-accent-foreground/25 bg-transparent px-6 py-3.5",
      "text-accent-foreground transition-opacity duration-moderate ease-app hover:opacity-80",
      "sm:w-auto sm:min-w-[11.5rem]",
    ].join(" "),
    storeIcon: "h-7 w-7 shrink-0",
    storeIconPlay: "h-6 w-6 shrink-0",
    storeKicker: "-mb-0.5 text-start text-[0.65rem] tracking-wider opacity-70",
    storeTitle: "text-start text-base leading-none tracking-tight",
    stage:
      "relative z-10 mx-auto flex w-full max-w-[20rem] items-center justify-center max-lg:order-1 lg:max-w-none",
    /**
     * Device chrome: 402×817 mockup, scaled down in the section.
     * Inner screen is 361×783 (5.1% sides, 2.08% top/bottom).
     */
    bezel: [
      "relative z-10 [container-type:inline-size]",
      "aspect-[402/817] w-[min(100%,14rem)]",
      "sm:w-[15.5rem] lg:w-[20rem]",
      "drop-shadow-[0_28px_48px_color-mix(in_oklab,var(--color-accent-foreground)_40%,transparent)]",
    ].join(" "),
    frame:
      "pointer-events-none absolute inset-0 z-0 size-full select-none object-contain",
    island:
      "pointer-events-none absolute top-[3.43%] left-1/2 z-30 h-auto w-[28.73%] -translate-x-1/2 select-none",
    screen: [
      "absolute z-10 overflow-hidden bg-background text-foreground",
      "inset-[2.08%_5.1%] rounded-[10.7cqi]",
    ].join(" "),
    phoneViewport: "absolute inset-0 overflow-hidden",
    phoneScroll:
      "relative flex w-full flex-col gap-2.5 px-3 pt-14 pb-10 will-change-transform",
    phoneHeader: "flex items-center justify-between gap-2",
    phoneIdentity: "flex min-w-0 flex-1 items-center gap-2",
    phoneAvatar: "size-9 shrink-0",
    phoneNotify:
      "size-9 min-w-9 rounded-full border border-border bg-surface text-foreground",
    phoneSpotlight: "!min-h-0 shrink-0 !rounded-[1.15rem] !p-3 !shadow-none",
    phoneMetrics: "grid grid-cols-1 gap-2.5",
    phoneMetric: "!min-h-0 !rounded-[1.15rem] !p-2.5 !shadow-none",
    phoneCta: "!min-h-0 shrink-0 !rounded-[1.15rem] !p-3",
    phoneQuickLabel:
      "px-0.5 text-start text-[0.65rem] font-semibold tracking-wide text-muted",
    phoneQuick:
      "grid grid-cols-3 gap-2 rounded-[1.15rem] border border-border bg-surface p-2.5",
    phoneQuickItem: "!min-h-0 !gap-1.5 !p-0",
    phoneTodo: "!min-h-0 !gap-2 !rounded-[1.15rem] !p-3",
    homeIndicator:
      "pointer-events-none absolute bottom-2 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-foreground/20",
    floatingBadge:
      "absolute z-20 hidden items-center gap-2 rounded-2xl border border-border bg-surface p-2.5 text-surface-foreground sm:flex",
    badgeIcon: "flex size-8 shrink-0 items-center justify-center rounded-full",
  },
});
