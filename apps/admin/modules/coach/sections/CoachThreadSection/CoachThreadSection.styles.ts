import { tv } from "tailwind-variants";

export const coachThreadSectionStyles = tv({
  slots: {
    root: "flex min-h-0 flex-1 overflow-hidden",
    sidebar:
      "hidden w-72 shrink-0 flex-col border-e border-border bg-surface-secondary/60 p-4 lg:flex",
    profile: "flex items-center gap-3",
    tabs: "mt-4 flex gap-3 text-sm text-muted",
    tabActive: "text-accent border-b-2 border-accent pb-1",
    nav: "mt-5 flex flex-col gap-1",
    navItem:
      "flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground",
    navItemActive: "bg-accent/10 text-accent",
    chats: "mt-6 space-y-1",
    chatItem:
      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-muted",
    chatActive: "border-s-2 border-accent bg-surface text-foreground",
    thread: "flex min-w-0 flex-1 flex-col",
    head: "flex items-center justify-between border-b border-border px-5 py-4",
    messages: "flex flex-1 flex-col gap-4 overflow-auto px-5 py-6",
    aiBubble:
      "max-w-[36rem] rounded-3xl border border-border bg-surface px-4 py-3 text-sm",
    userBubble:
      "ms-auto max-w-[28rem] rounded-3xl bg-accent px-4 py-3 text-sm text-accent-foreground",
    linkCard:
      "mt-3 rounded-2xl border border-border bg-surface-secondary p-3 text-sm",
    composer:
      "m-4 flex items-center gap-2 rounded-[1.5rem] border border-border bg-surface px-3 py-2",
  },
});
