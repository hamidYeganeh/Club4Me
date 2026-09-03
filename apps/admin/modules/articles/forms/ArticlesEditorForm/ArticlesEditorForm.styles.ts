import { tv } from "tailwind-variants";

export const articlesEditorFormStyles = tv({
  slots: {
    root: "flex flex-col gap-5",
    grid: "grid gap-4 md:grid-cols-2",
    field: "w-full",
    label: "text-sm font-medium text-foreground",
    input:
      "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-accent",
    textarea:
      "min-h-24 w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-accent",
    actions: "flex flex-wrap items-center gap-3",
    hint: "mt-1 text-xs text-muted",
    error: "mt-1 text-xs text-danger",
    editorWrap: "flex flex-col gap-2",
  },
});
