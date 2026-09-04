import { tv } from "tailwind-variants";

export const discoveryClubSlotsScreenStyles = tv({
  slots: {
    root: "relative isolate flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-background px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]",
    hero: "relative z-10 min-h-[50dvh] shrink-0",
    coverWrap: "pointer-events-none absolute inset-0 z-0 overflow-hidden",
    cover:
      "absolute inset-0 h-full w-full bg-cover bg-center bg-fixed will-change-transform",
    coverFallback:
      "absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_35%_28%,color-mix(in_oklch,var(--accent)_28%,transparent),transparent_28rem),linear-gradient(145deg,var(--surface-secondary),var(--background))] text-accent/70",
    overlay: "pointer-events-none absolute inset-0 z-[1]",
    grain:
      "pointer-events-none absolute inset-0 z-[2] opacity-[0.14] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.55%22/%3E%3C/svg%3E')]",
    accentOrb:
      "pointer-events-none absolute inset-x-0 bottom-0 z-[3] mx-auto h-48 max-w-lg rounded-full bg-accent/18 blur-3xl",
    topBar:
      "absolute inset-x-0 top-0 z-20 flex items-center justify-between px-2 pt-[max(1rem,env(safe-area-inset-top))]",
    backButton:
      "size-11 rounded-full border border-white/18 bg-black/30 text-white backdrop-blur-xl transition-transform duration-300 data-[pressed=true]:scale-95",
    themeButton:
      "size-11 border-transparent bg-accent text-accent-foreground hover:bg-accent/90 [&_.icon]:text-[17px]",
    heroCopy:
      "absolute inset-x-0 top-[30%] z-10 flex w-full flex-col items-center px-6 text-center",
    heroEyebrow: "text-[0.7rem] font-extrabold tracking-[0.22em] text-white/82",
    heroTitle:
      "mt-1.5 w-full text-[clamp(3.35rem,15vw,5rem)] leading-[0.88] font-black tracking-[-0.065em] text-balance text-white",
    heroSubtitle:
      "mt-2 max-w-[24ch] truncate text-[0.72rem] font-bold tracking-[0.16em] text-white/78",
    chipRow: "absolute inset-x-0 bottom-4 z-20 px-2",
    chipScroller: "w-full pb-1",
    chipContent: "flex w-max gap-2 pe-2",
    chipButton:
      "shrink-0 font-semibold outline-none transition-transform duration-300 data-[pressed=true]:scale-95",
    chipActive: "border-transparent bg-accent text-accent-foreground",
    chipIdle: "border border-white/12 bg-black/40 text-white/92",
    panel:
      "fixed inset-x-0 bottom-0 z-30 flex min-h-[50dvh] max-h-[50dvh] w-screen max-w-none flex-col rounded-t-4xl bg-surface px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur-2xl",
    panelBody: "flex min-h-0 flex-1 flex-col",
    panelContent: "min-h-0 flex-1 space-y-7 overflow-y-auto pb-5",
    section: "space-y-3",
    sectionLabel:
      "flex items-center gap-2 text-lg font-semibold text-foreground/80",
    sectionIcon:
      "grid size-6 place-items-center rounded-full bg-accent/15 text-accent",
    radioRow: "w-full pb-1",
    radioGroup: "flex w-max gap-2",
    dateTabs: "w-max",
    dateTabsListContainer: "rounded-none bg-transparent p-0",
    dateTabsList: "flex w-max gap-2 rounded-none border-0 bg-transparent p-0",
    dateTab:
      "group flex min-h-[4.55rem] min-w-[4.15rem] flex-col items-center justify-center gap-1 rounded-[1.15rem] border border-transparent bg-surface-tertiary px-3 py-2.5 text-foreground opacity-100 transition-[transform,border-color,background-color,color] duration-300 ease-out data-[hovered=true]:scale-[1.03] data-[selected=true]:border-foreground/80 data-[selected=true]:bg-surface",
    dateTabIndicator: "hidden",
    dateRadio: "group",
    dateContent:
      "flex min-h-[4.55rem] w-full min-w-[4.15rem] flex-col items-center justify-center gap-1 rounded-[1.15rem] border border-transparent bg-surface-tertiary px-3 py-2.5 text-foreground transition-[transform,border-color,background-color,color] duration-300 ease-out group-data-[hovered=true]:scale-[1.03]",
    dateContentSelected: "border-foreground/80 bg-surface text-foreground",
    dateDay: "text-2xl font-black tabular-nums leading-none tracking-tight",
    dateWeekday:
      "text-base font-medium text-muted transition-colors group-data-[selected=true]:text-foreground/75",
    timeRadio: "group",
    timeArea: "min-h-36",
    timeScroller: "w-full pb-1",
    timeEmpty:
      "flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-foreground/20 bg-surface-tertiary/50 px-4 py-5 text-center text-sm text-muted",
    timeEmptyImage: "size-16 object-contain",
    timeContent:
      "w-full rounded-2xl border border-transparent bg-surface-tertiary px-4 py-3 text-center text-base font-semibold tracking-tight text-foreground/55 transition-[transform,border-color,background-color,color] duration-300 ease-out group-data-[hovered=true]:scale-[1.02]",
    timeContentSelected: "border-foreground/80 bg-surface text-foreground",
    footer: "mt-auto flex items-end justify-between gap-4 pt-4",
    footerSticky:
      "sticky bottom-0 border-t border-foreground/10 bg-surface backdrop-blur-2xl",
    priceLabel: "text-[0.7rem] font-medium tracking-wide text-muted",
    priceValue:
      "mt-1 text-[1.65rem] font-black tracking-tight text-foreground tabular-nums",
    bookButton: "h-14 w-1/2",
    disclaimer: "mt-3 px-3 text-center text-[0.64rem] leading-5 text-muted/90",
    empty:
      "flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center",
    emptyImage: "size-36 object-contain drop-shadow-lg sm:size-40",
    emptyText: "max-w-[28ch] text-sm leading-6 text-muted",
    controlHidden: "sr-only",
  },
});
