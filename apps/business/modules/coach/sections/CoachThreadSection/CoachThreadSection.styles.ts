import { tv } from "tailwind-variants";

export const coachThreadSectionStyles = tv({
  slots: {
    root: "flex min-h-0 flex-1 overflow-hidden",
    sidebar: [
      "hidden w-[18.5rem] shrink-0 flex-col gap-4 border-e border-border/60",
      "bg-surface/50 p-4 lg:flex dark:bg-surface/30",
    ].join(" "),
    profile: "flex items-center gap-3 rounded-[1.25rem] bg-surface p-3 dark:bg-surface-secondary/60",
    tabs: "w-full",
    nav: "flex flex-col gap-1",
    navItem:
      "flex w-full items-center justify-start gap-2 rounded-[1rem] px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-secondary/80 hover:text-foreground",
    navItemActive: "bg-accent/12 font-medium text-accent",
    sectionLabel: "px-1 text-[11px] font-medium uppercase tracking-wide text-muted",
    chats: "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto",
    chatItem:
      "flex w-full items-center justify-between gap-2 rounded-[1rem] px-3 py-2.5 text-start text-sm text-muted transition-colors hover:bg-surface-secondary/70 hover:text-foreground",
    chatActive:
      "border-s-[3px] border-accent bg-surface text-foreground shadow-sm dark:bg-surface-secondary/80",
    thread: "flex min-w-0 flex-1 flex-col bg-background/60",
    head: "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4",
    headMeta: "flex flex-wrap items-center gap-2 text-xs text-muted",
    badge:
      "inline-flex items-center rounded-full bg-[var(--chart-2)]/15 px-2.5 py-0.5 text-[11px] font-medium text-[var(--chart-2)]",
    messages: "flex flex-1 flex-col gap-4 overflow-auto px-5 py-6",
    aiRow: "flex max-w-[40rem] items-start gap-3",
    aiAvatar:
      "mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground",
    aiBubble: "app-card flex-1 rounded-[1.35rem] px-4 py-3 text-sm shadow-none",
    userBubble:
      "ms-auto max-w-[28rem] rounded-[1.5rem] bg-accent px-4 py-3 text-sm text-accent-foreground",
    voiceBubble:
      "ms-auto flex max-w-[20rem] items-center gap-3 rounded-[1.5rem] bg-accent px-4 py-3 text-accent-foreground",
    voiceWave: "flex h-8 flex-1 items-end gap-0.5",
    linkCard:
      "mt-3 rounded-[1.15rem] border border-border/70 bg-surface/80 p-3 text-sm",
    typing:
      "inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface px-3 py-2",
    typingDot: "size-1.5 animate-pulse rounded-full bg-muted",
    composer:
      "m-4 flex items-center gap-2 rounded-[1.75rem] border border-border/70 bg-surface px-3 py-2 shadow-sm",
    downloadBtn:
      "inline-flex items-center gap-2 rounded-full bg-[var(--chart-2)] px-3.5 py-2 text-xs font-medium text-white",
  },
});
