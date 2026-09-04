import { tv } from "tailwind-variants";

export const settingsContentSectionStyles = tv({
  slots: {
    root: "mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 lg:p-8",
    cover:
      "relative h-44 overflow-hidden rounded-[1.75rem] border border-border",
    coverImage: "size-full object-cover",
    edit: "absolute end-4 top-4 size-10 rounded-full bg-surface/90",
    identity: "relative -mt-12 flex flex-wrap items-end justify-between gap-4 px-2",
    person: "flex items-end gap-4",
    name: "text-2xl font-semibold",
    email: "text-sm text-muted",
    actions: "flex gap-2",
    card: "rounded-[1.75rem] border border-border bg-surface p-6",
    grid: "mt-5 grid gap-4 md:grid-cols-2",
    field:
      "flex items-center gap-3 rounded-2xl bg-surface-secondary px-4 py-3",
    payout: "mt-4 flex items-center justify-between rounded-2xl bg-surface-secondary px-4 py-3",
  },
});
