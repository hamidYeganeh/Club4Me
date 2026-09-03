import { tv } from "tailwind-variants";

export const accountAuthRolesOptionsSectionStyles = tv({
  slots: {
    root: "mt-8 flex w-full max-w-sm flex-col gap-3 self-stretch sm:self-center",
    item: "h-auto min-h-0 w-full justify-start gap-3.5 p-4 text-start shadow-none active:scale-[0.99]",
    icon: "flex size-11 shrink-0 items-center justify-center rounded-full",
    label: "flex-1",
    chevron: "text-muted",
  },
  variants: {
    tone: {
      athlete: {
        icon: "bg-warning-soft text-warning",
      },
      coach: {
        icon: "bg-danger-soft text-danger",
      },
      owner: {
        icon: "bg-success-soft text-success",
      },
    },
  },
});
