import { tv } from "tailwind-variants";

export const landingMenuOverlayStyles = tv({
  slots: {
    root: "fixed inset-0 z-999 flex flex-col",
    backdrop:
      "absolute inset-0 bg-(--brand-deep) transition-opacity duration-moderate ease-app",
    panel: [
      "relative z-10 flex h-full flex-col p-2 sm:p-3",
      "transition-[opacity,transform] duration-moderate ease-app",
    ],
    top: "flex items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-(--on-brand) sm:px-10 sm:pt-8",
    brand: "flex items-center gap-2 font-bold tracking-[0.18em] uppercase",
    nav: "flex flex-1 flex-col justify-center gap-1 px-6 sm:px-10",
    link: [
      "block text-3xl font-bold tracking-tight text-(--on-brand)",
      "transition-colors duration-fast ease-app hover:text-accent sm:text-4xl md:text-6xl",
    ],
    bottom: [
      "flex flex-col gap-6 border-t border-(--glass-border) px-6 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
      "text-(--on-brand) sm:flex-row sm:items-center sm:justify-between sm:px-10",
    ],
    social:
      "flex gap-5 text-(--on-brand-muted) [&_a]:transition-colors [&_a]:duration-fast [&_a]:ease-app hover:[&_a]:text-(--on-brand)",
  },
});
