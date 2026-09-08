import { tv } from "tailwind-variants";

export const accountAuthRolesOptionsSectionStyles = tv({
  slots: {
    root: "flex w-full max-w-xl flex-col gap-4 self-stretch sm:self-center",
    formRoot:
      "flex w-full max-w-xl flex-col self-stretch pb-4 pt-1 sm:self-center",
    hero: "flex flex-col items-center text-center",
    heroImage: "h-auto w-[min(15.5rem,72vw)] object-contain drop-shadow-xl",
    heroTitle: "mt-1 text-balance text-3xl leading-tight sm:text-4xl",
    heroDescription: "mt-2 max-w-[20rem] text-balance leading-6",
    form: "flex w-full flex-col gap-5 rounded-3xl bg-surface p-5 text-start",
    field:
      "min-h-14 rounded-[1.15rem] border border-border bg-surface shadow-sm transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15",
    submit: "mt-2 w-full font-bold shadow-sm",
    item: "h-auto min-h-0 w-full justify-start gap-3.5 rounded-3xl border border-border bg-surface p-5 text-start shadow-none active:scale-[0.99]",
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
