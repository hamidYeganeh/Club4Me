import { tv } from "tailwind-variants";

export const landingAboutUsSectionStyles = tv({
  slots: {
    root: [
      "mt-3 w-full overflow-hidden rounded-(--radius-card-lg)",
      "bg-background px-5 py-20 font-sans md:px-10 lg:px-10 lg:py-[140px]",
    ].join(" "),
    inner: "landing-container",
    header: "mb-12 flex flex-col items-center text-center",
    labelRow: "mb-4 flex items-center gap-2",
    labelChip: [
      "flex size-7 items-center justify-center rounded-full",
      "bg-accent text-accent-foreground",
    ].join(" "),
    label: [
      "text-[12px] font-bold uppercase tracking-[0.14em]",
      "text-foreground",
    ].join(" "),
    title: [
      "max-w-[850px] text-balance text-[32px] font-extrabold leading-[1.15]",
      "tracking-tight text-foreground lg:text-[42px] lg:leading-[1.1]",
    ].join(" "),
    columns: [
      "mt-12 flex flex-col items-center gap-10",
      "lg:flex-row lg:items-center",
    ].join(" "),
    startCol: "w-full shrink-0 lg:w-[220px]",
    startImage: [
      "h-[240px] w-full rounded-[12px] object-cover",
      "lg:h-[300px]",
    ].join(" "),
    middleCol: "w-full flex-1",
    statRow: "mb-5 flex items-center gap-4",
    statValue: [
      "text-[48px] font-extrabold leading-none tracking-tighter",
      "text-foreground sm:text-[72px] lg:text-[84px]",
    ].join(" "),
    statMeta: "flex flex-col justify-center",
    statLine: [
      "text-[13px] font-bold leading-tight tracking-[0.06em]",
      "text-foreground",
    ].join(" "),
    divider: "my-5 h-px bg-separator",
    copy: "space-y-3",
    paragraph: "text-[14px] leading-[1.7] text-muted",
    ctaRow: "mt-7 flex flex-wrap items-center gap-5",
    cta: [
      "group h-auto min-h-0 gap-2.5 rounded-full bg-accent",
      "px-0 py-1.5 ps-5 pe-1.5 shadow-none",
      "text-accent-foreground transition-all duration-moderate ease-app",
      "hover:bg-foreground hover:text-background",
      "data-[pressed=true]:scale-[0.98]",
    ].join(" "),
    ctaLabel: [
      "text-[13px] font-bold tracking-[0.06em]",
      "text-accent-foreground transition-colors duration-moderate ease-app",
      "group-hover:text-background",
    ].join(" "),
    ctaChip: [
      "flex size-[34px] items-center justify-center rounded-full",
      "bg-foreground text-background transition-all duration-moderate ease-app",
      "group-hover:bg-background group-hover:text-foreground",
    ].join(" "),
    reviews: "flex items-center gap-3",
    avatars: "flex items-center",
    avatar: "size-10 ring-2 ring-background",
    avatarOverlap: "-ms-3",
    reviewMeta: "ms-2.5 flex flex-col",
    stars: "flex gap-0.5 text-accent",
    reviewCount: "text-[12px] text-muted",
    endCol: "w-full shrink-0 lg:w-[280px]",
    endImage: [
      "h-[280px] w-full rounded-[14px] object-cover",
      "lg:h-[400px]",
    ].join(" "),
  },
});
