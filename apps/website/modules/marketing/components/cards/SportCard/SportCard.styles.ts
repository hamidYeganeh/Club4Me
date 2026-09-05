import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

export const sportCardVariants = tv({
  slots: {
    root: [
      // Override HeroUI Button defaults (h-10, inline-flex, items-center, etc.)
      "relative !flex flex-col items-stretch justify-between border-0",
      "overflow-hidden text-start whitespace-normal",
      "transition-transform duration-fast ease-app data-[pressed=true]:scale-[0.98]",
      "outline-none",
    ].join(" "),
    backgroundImage:
      "pointer-events-none absolute inset-0 size-full object-cover select-none",
    overlay: "pointer-events-none absolute inset-0",
    body: "relative z-10 flex h-full min-h-0 flex-col justify-between",
    content: "flex min-w-0 flex-col",
    icon: "",
    subtitle: "opacity-95",
    title: "leading-tight tracking-tight",
    action: "flex shrink-0 items-center justify-center self-end rounded-full",
  },
  variants: {
    size: {
      sm: {
        root: "h-[270px] w-[200px] rounded-[24px] p-4",
        content: "gap-1",
        icon: "mb-1 [&_svg]:!size-7",
        subtitle: "text-xs",
        title: "text-[22px]",
        action: "size-9 [&_svg]:!size-4",
      },
      md: {
        root: "h-[380px] w-[280px] rounded-[32px] p-6",
        content: "gap-1.5",
        icon: "mb-1.5 [&_svg]:!size-10",
        subtitle: "text-sm",
        title: "text-[32px]",
        action: "size-12 [&_svg]:!size-[22px]",
      },
      lg: {
        root: "h-[456px] w-[336px] rounded-[36px] p-7",
        content: "gap-2",
        icon: "mb-2 [&_svg]:!size-12",
        subtitle: "text-base",
        title: "text-[38px]",
        action: "size-14 [&_svg]:!size-6",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type SportCardVariantProps = VariantProps<typeof sportCardVariants>;
