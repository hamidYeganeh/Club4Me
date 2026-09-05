import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const clubClassCardVariants = tv({
  slots: {
    root: [
      "relative flex flex-col overflow-hidden",
      "text-start whitespace-normal",
    ].join(" "),
    backgroundImage:
      "pointer-events-none absolute inset-0 size-full object-cover select-none",
    overlay: "pointer-events-none absolute inset-0",
    body: "relative z-10 flex h-full min-h-0 flex-col",
    header: "flex min-w-0 flex-col",
    category: ["inline-flex w-fit items-center border-0", "text-current"].join(
      " ",
    ),
    categoryIcon: "shrink-0",
    date: "uppercase tracking-wide",
    title: "leading-[1.2] tracking-tight",
    footer: "mt-auto flex items-end justify-between gap-3",
    meta: "flex min-w-0 flex-1 flex-col",
    metaItem: "inline-flex min-w-0 items-center",
    metaIcon: "shrink-0 opacity-60",
    action: [
      "flex shrink-0 items-center justify-center",
      "data-[pressed=true]:scale-[0.97]",
    ].join(" "),
  },
  variants: {
    size: {
      sm: {
        root: "h-[272px] w-[220px] rounded-[28px] p-4",
        header: "gap-2.5",
        category: "h-7 gap-1 rounded-full px-2.5 text-xs",
        categoryIcon: "size-3",
        date: "text-[10px] font-bold",
        title: "mt-4 text-base font-bold",
        meta: "gap-1.5",
        metaItem: "gap-1.5 text-xs",
        metaIcon: "size-3.5",
        action: "size-10 min-w-10 rounded-[14px] [&_svg]:!size-4",
      },
      md: {
        root: "h-[346px] w-[280px] rounded-[32px] p-5",
        header: "gap-3",
        category: "h-8 gap-1.5 rounded-full px-3 text-sm",
        categoryIcon: "size-3.5",
        date: "text-xs font-bold",
        title: "mt-5 text-[22px] font-bold",
        meta: "gap-2",
        metaItem: "gap-2 text-sm",
        metaIcon: "size-4",
        action: "size-12 min-w-12 rounded-[18px] [&_svg]:!size-5",
      },
      lg: {
        root: "h-[420px] w-[340px] rounded-[40px] p-6",
        header: "gap-4",
        category: "h-9 gap-1.5 rounded-full px-3.5 text-sm",
        categoryIcon: "size-4",
        date: "text-sm font-bold",
        title: "mt-6 text-[28px] font-bold",
        meta: "gap-2.5",
        metaItem: "gap-2 text-[15px]",
        metaIcon: "size-[18px]",
        action: "size-14 min-w-14 rounded-[20px] [&_svg]:!size-6",
      },
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

export type ClubClassCardVariantProps = VariantProps<
  typeof clubClassCardVariants
>;
