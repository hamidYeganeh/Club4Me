import { tv } from "tailwind-variants";

export const accountAuthRolesOptionsSectionStyles = tv({
  slots: {
    root: "mt-8 flex w-full max-w-sm flex-col gap-4 self-stretch sm:self-center",
    item: "h-auto min-h-0 w-full justify-start gap-3.5 p-4 text-start shadow-none active:scale-[0.99]",
    icon: "flex size-11 shrink-0 items-center justify-center rounded-full",
    label: "flex-1",
    chevron: "text-foreground/50",
  },
  variants: {
    tone: {
      athlete: {
        icon: "bg-surface text-foreground",
      },
      coach: {
        icon: "bg-surface text-foreground",
      },
      owner: {
        icon: "bg-surface text-foreground",
      },
    },
  },
});
