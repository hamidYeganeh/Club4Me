import { tv } from "tailwind-variants";

export const spotlightCardVariants = tv({
  slots: {
    root: [
      "relative isolate flex min-h-[220px] w-full flex-col overflow-hidden",
      "rounded-[2rem] bg-accent p-5 text-start text-accent-foreground",
      "before:pointer-events-none before:absolute before:-end-16 before:-top-16",
      "before:size-48 before:rounded-full before:border-[28px] before:border-accent-foreground/8",
      "after:pointer-events-none after:absolute after:-bottom-24 after:-start-16",
      "after:size-56 after:rounded-full after:bg-accent-foreground/5",
    ].join(" "),
    header: "relative z-10 flex items-center justify-between gap-3",
    eyebrow: [
      "inline-flex min-h-7 items-center rounded-full bg-accent-foreground/10 px-3",
      "text-[0.6875rem] font-bold tracking-wide text-accent-foreground",
    ].join(" "),
    icon: [
      "flex size-11 shrink-0 items-center justify-center rounded-[0.875rem]",
      "bg-accent-foreground text-accent [&_svg]:size-5",
    ].join(" "),
    content: "relative z-10 mt-auto flex max-w-[18rem] flex-col gap-1.5 pt-6",
    title:
      "text-balance text-[1.75rem] leading-[1.18] tracking-tight text-accent-foreground",
    description:
      "max-w-[17rem] text-pretty text-sm leading-relaxed text-accent-foreground/75",
    footer: "relative z-10 mt-5 flex items-end justify-between gap-4",
    metric: "flex min-w-0 flex-1 flex-col gap-2",
    valueRow: "flex items-baseline gap-1 leading-none",
    value:
      "text-[2.5rem] font-black leading-none tracking-[-0.04em] text-accent-foreground tabular-nums",
    unit: "text-sm font-bold text-accent-foreground/75",
    progressTrack:
      "h-1.5 w-full overflow-hidden rounded-full bg-accent-foreground/15",
    progressBar: "h-full rounded-full bg-accent-foreground",
    action: [
      "min-h-12 shrink-0 rounded-2xl bg-accent-foreground px-4",
      "font-bold text-accent shadow-none transition-transform duration-fast ease-app",
      "hover:opacity-90 data-[hovered=true]:opacity-90",
      "data-[pressed=true]:scale-[0.97]",
    ].join(" "),
  },
});
