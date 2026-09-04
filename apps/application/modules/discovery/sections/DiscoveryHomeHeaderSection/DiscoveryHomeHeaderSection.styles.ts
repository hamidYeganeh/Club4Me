import { tv } from "tailwind-variants";

export const discoveryHomeHeaderSectionStyles = tv({
  slots: {
    root: "app-header justify-between",
    spacer: "app-header-spacer",
    lead: "flex min-w-0 items-center gap-3",
    title: "shrink-0 text-[1.4rem] tracking-tight",
  },
});
