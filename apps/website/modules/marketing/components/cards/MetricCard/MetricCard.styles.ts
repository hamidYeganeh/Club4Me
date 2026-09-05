import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const metricCardVariants = tv({
  slots: {
    root: [
      // Override HeroUI `.card` (flex-col gap-3 p-4)
      "relative !flex !flex-col !gap-0 border-0 bg-surface",
      "overflow-hidden rounded-[24px] text-start text-surface-foreground",
      "outline-none shrink-0",
      "data-[pressable=true]:cursor-pointer",
      "data-[pressable=true]:transition-transform data-[pressable=true]:active:scale-[0.99]",
    ].join(" "),
    // Override `.card__header` (flex-col)
    header: "!flex !flex-row !items-center !justify-between gap-2 p-0",
    titleGroup: "flex min-w-0 flex-row items-center gap-2",
    icon: [
      "flex shrink-0 items-center justify-center",
      "bg-[var(--metric-accent,var(--stats-orange))] text-background",
      "[&_svg]:block [&_svg]:text-current",
    ].join(" "),
    title: [
      // Override `.card__title`
      "!font-semibold !leading-none truncate text-foreground",
    ].join(" "),
    period: [
      "inline-flex h-auto min-h-0 shrink-0 items-center gap-0.5 rounded-md !px-0 !py-0",
      "font-medium text-muted shadow-none",
      "hover:bg-transparent hover:text-foreground",
      "pressed:bg-transparent data-[pressed=true]:bg-transparent",
    ].join(" "),
    periodIcon: "shrink-0 text-current",
    // Override `.card__content` (flex-col)
    body: "!flex !p-0 min-h-0",
    meta: "flex min-w-0 flex-col text-start",
    valueRow: "flex leading-none",
    value: "font-bold leading-none tracking-tight text-foreground",
    unit: "leading-none text-foreground",
    status: "!leading-snug text-muted",
    chart: "flex flex-col items-stretch",
    plot: "min-h-0 flex-1",
    chartPlot: "flex h-full w-full flex-row items-end justify-between",
    days: "grid w-full grid-cols-7 gap-0",
    day: "text-center font-medium leading-none text-muted",
    barTrack: [
      "relative h-full w-[10px] shrink-0 overflow-hidden rounded-full",
      "bg-surface-secondary",
    ].join(" "),
    barFill: [
      "absolute inset-x-0 bottom-0 rounded-full",
      "bg-[var(--metric-accent,var(--stats-orange))]",
    ].join(" "),
    rangeFill: [
      "absolute inset-x-0 rounded-full",
      "bg-[var(--metric-accent,var(--stats-purple))]",
    ].join(" "),
    linePlot: "h-full w-full",
    lineSvg: "block h-full w-full",
    rings: "flex h-full w-full flex-row items-center justify-between",
    ringCol: "relative flex items-center justify-center",
    ringStatus: [
      "pointer-events-none absolute inset-0 z-10",
      "flex items-center justify-center",
    ].join(" "),
    ringStatusIcon: "size-2",
    ringSvg: "block",
    dots: "flex h-full w-full flex-row items-center justify-between px-0.5",
    dotCol: "flex flex-col-reverse items-center gap-1",
    dot: "rounded-full bg-surface-secondary",
    dotFilled: "bg-[var(--metric-accent,var(--success))]",
    moods: "flex h-full w-full flex-row items-center justify-between",
    moodIcon: "text-foreground",
    moodEmpty: "rounded-full bg-surface-secondary",
  },
  variants: {
    variant: {
      horizontal: {
        // Design frame 343×118 — fluid width, locked ratio
        root: "w-full !aspect-[343/118] !h-auto !max-h-none !p-4",
        header: "mb-2",
        titleGroup: "gap-2",
        icon: "size-7 rounded-lg [&_svg]:size-3.5",
        title: "!text-sm",
        period: "text-xs",
        periodIcon: "size-3",
        body: "!flex-row !items-end !justify-between !gap-3 flex-1",
        meta: "flex-1 gap-0.5",
        valueRow: "flex-row items-baseline gap-1",
        value: "text-[28px]",
        unit: "text-sm font-semibold",
        status: "!text-xs",
        chart: "h-[62px] w-[140px] shrink-0 gap-1",
        day: "text-[9px]",
        dot: "size-1.5",
        moodIcon: "size-4",
        moodEmpty: "size-4",
        ringCol: "size-5",
        ringSvg: "size-5",
      },
      vertical: {
        root: "!h-[196px] !w-[168px] !p-3.5",
        header: "mb-2.5",
        titleGroup: "gap-0",
        icon: "size-8 rounded-[10px] [&_svg]:size-4",
        title: "sr-only",
        period: "text-xs",
        periodIcon: "size-3",
        body: "!flex-col !items-stretch !justify-between !gap-2 flex-1",
        meta: "w-full gap-0.5",
        valueRow: "flex-col items-start gap-0.5",
        value: "text-[28px]",
        unit: "text-xs font-medium text-muted",
        status: "!text-xs",
        chart: "mt-auto h-[72px] w-full gap-1",
        day: "text-[9px]",
        dot: "size-1.5",
        moodIcon: "size-3.5",
        moodEmpty: "size-3.5",
        ringCol: "size-[18px]",
        ringSvg: "size-[18px]",
        ringStatusIcon: "size-1.5",
      },
    },
  },
  defaultVariants: {
    variant: "horizontal",
  },
});

export type MetricCardVariantProps = VariantProps<typeof metricCardVariants>;
