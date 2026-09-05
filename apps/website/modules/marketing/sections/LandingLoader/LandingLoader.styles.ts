import { tv } from "tailwind-variants";

export const landingLoaderStyles = tv({
  slots: {
    root: [
      "fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8",
      "bg-foreground text-background",
      "will-change-transform",
    ],
    mark: "flex items-center gap-2 text-2xl font-bold tracking-[0.18em] uppercase",
    track: "h-px w-40 overflow-hidden rounded-full bg-background/20",
    fill: "h-full w-full origin-left bg-accent will-change-transform",
  },
});
