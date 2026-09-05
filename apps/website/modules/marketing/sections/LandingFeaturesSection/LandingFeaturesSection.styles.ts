import { tv } from "tailwind-variants";

export const landingFeaturesSectionStyles = tv({
  slots: {
    root: [
      "relative z-10 mt-3 overflow-hidden rounded-(--radius-card-lg)",
      "bg-background px-5 py-16 text-foreground sm:px-6 md:px-[3.75rem] md:py-[6.25rem]",
    ],
    inner:
      "landing-container grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-[6.25rem]",
    bento: "grid h-full grid-cols-1 gap-4 sm:grid-cols-2",
    heroCard: [
      "group relative col-span-1 h-[18rem] overflow-hidden rounded-[2rem] sm:col-span-2 md:h-[25rem]",
      "bg-surface-secondary",
    ],
    heroImg:
      "size-full object-cover transition-transform duration-[1200ms] ease-app will-change-transform group-hover:scale-110",
    mockup: [
      "absolute inset-x-4 -bottom-4 top-4 overflow-hidden rounded-t-[1.25rem]",
      "border-x border-t border-foreground/5 bg-surface",
      "md:inset-x-6 md:-bottom-6 md:top-6",
    ],
    chrome:
      "flex h-8 shrink-0 items-center gap-1.5 border-b border-foreground/5 bg-surface-secondary px-4",
    trafficClose: "size-2.5 rounded-full bg-stats-red",
    trafficMin: "size-2.5 rounded-full bg-stats-yellow",
    trafficMax: "size-2.5 rounded-full bg-success",
    mockupStage:
      "flex h-full items-start justify-center bg-background px-3 pt-3",
    mockupClub: "w-[min(100%,16rem)] max-w-none shadow-none",
    quoteCard: [
      "landing-dark flex min-h-[16rem] flex-col justify-between rounded-[2rem]",
      "bg-(--brand-deep) p-6 text-(--on-brand) md:h-[26.25rem] md:p-10",
    ],
    quote:
      "text-[1.125rem] font-medium leading-[1.3] tracking-tight text-(--on-brand) md:text-[1.375rem]",
    authorRow: "mt-8 flex items-center gap-4",
    avatar: "size-12 rounded-full object-cover opacity-90",
    authorName: "text-[0.9375rem] font-semibold text-(--on-brand)",
    authorRole: "text-[0.8125rem] text-(--on-brand-muted)",
    portraitCard: "h-[16rem] overflow-hidden rounded-[2rem] md:h-[26.25rem]",
    portraitImg:
      "size-full object-cover transition-transform duration-[1200ms] ease-app will-change-transform hover:scale-105",
    content: "flex flex-col",
    heading: [
      "mb-6 max-w-[33.7rem] text-[clamp(1.75rem,6vw,3.25rem)] font-medium leading-[1.1]",
      "tracking-[-0.035em] text-balance text-foreground md:mb-8",
    ],
    body: "mb-12 max-w-[30rem] text-[1.0625rem] leading-relaxed text-muted md:text-[1.125rem]",
    actions:
      "mb-10 flex flex-col items-stretch gap-3 sm:mb-16 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4",
    primaryBtn: [
      "group h-14 w-full gap-6 rounded-[0.875rem] ps-8 pe-2 py-2 sm:w-auto",
      "bg-foreground text-[1rem] font-medium text-background shadow-lg",
      "[--button-bg:var(--foreground)] [--button-fg:var(--background)]",
      "[--button-bg-hover:var(--foreground)] [--button-bg-pressed:var(--foreground)]",
      "transition-transform duration-moderate ease-app",
      "hover:bg-foreground hover:opacity-95 hover:scale-[1.02]",
      "data-[hovered=true]:bg-foreground data-[hovered=true]:opacity-95 data-[hovered=true]:scale-[1.02]",
      "data-[pressed=true]:scale-[0.98] data-[pressed=true]:shadow-inner",
    ],
    primaryChip: [
      "grid size-10 shrink-0 place-items-center rounded-[0.625rem] bg-background text-foreground",
      "transition-transform duration-moderate ease-app group-hover:-translate-x-0.5",
    ],
    secondaryBtn: [
      "h-14 w-full rounded-[0.875rem] border border-separator bg-surface px-8 py-3.5 sm:w-auto",
      "text-[1rem] font-medium text-foreground shadow-none",
      "transition-[transform,background-color] duration-moderate ease-app",
      "hover:bg-surface-secondary hover:scale-[1.02]",
      "data-[hovered=true]:bg-surface-secondary data-[hovered=true]:scale-[1.02]",
      "data-[pressed=true]:scale-[0.98]",
    ],
    checklist: "flex flex-col",
    checkRow: [
      "flex items-center gap-4 border-b border-separator py-5 text-foreground",
      "last:border-b-0",
    ],
    checkIcon: "shrink-0 text-foreground",
    checkLabel:
      "grow text-[0.9375rem] font-medium leading-relaxed text-foreground",
  },
});
