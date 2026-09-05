import { tv } from "tailwind-variants";

export const landingContactModalStyles = tv({
  slots: {
    root: "fixed inset-0 z-90 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6",
    backdrop:
      "absolute inset-0 bg-foreground/40 backdrop-blur-md transition-opacity duration-moderate ease-app",
    panel: [
      "relative z-10 max-h-[92svh] w-full overflow-y-auto rounded-[2rem]",
      "bg-surface p-6 text-foreground shadow-lg shadow-foreground/15",
      "transition-[opacity,transform] duration-moderate ease-app sm:max-w-lg sm:p-8",
    ],
    header: "flex items-start justify-between gap-4",
    title: "mt-3 text-3xl font-bold leading-[0.95] sm:text-5xl",
    form: "mt-7 flex flex-col gap-4",
    field: "flex flex-col gap-2",
    label: "text-xs font-bold tracking-[0.18em] text-muted uppercase",
    input: [
      "w-full rounded-2xl border border-border bg-field-background",
      "px-4 py-3 text-base outline-none transition-[border-color,box-shadow] duration-fast ease-app",
      "focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_oklch,var(--accent)_22%,transparent)]",
    ],
    submit: [
      "rounded-full bg-accent px-7 py-3.5 text-sm font-bold",
      "tracking-wide text-accent-foreground transition-opacity duration-moderate ease-app hover:opacity-90",
      "disabled:opacity-50",
    ],
    success: "mt-8 rounded-[1.5rem] bg-surface-secondary p-6 text-center",
    check:
      "mx-auto grid size-12 place-items-center rounded-full bg-accent text-accent-foreground",
    successTitle: "mt-4 text-lg font-bold",
    successBody: "mt-2 mb-6 text-sm text-muted",
  },
});
