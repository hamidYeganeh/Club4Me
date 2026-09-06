import { tv } from "tailwind-variants";

export const splashScreenStyles = tv({
  slots: {
    root: "fixed inset-y-0 inset-x-0 z-[200] mx-auto flex h-dvh w-full max-w-xl items-center justify-center bg-accent transition-opacity duration-500 ease-out motion-reduce:transition-none",
    logo: "animate-[splash-logo-intro_900ms_cubic-bezier(0.22,1,0.36,1)_both] drop-shadow-[0_14px_24px_color-mix(in_oklch,var(--surface)_24%,transparent)] will-change-transform motion-reduce:animate-none",
  },
  variants: {
    visible: {
      true: {
        root: "opacity-100",
      },
      false: {
        root: "pointer-events-none opacity-0",
      },
    },
  },
  defaultVariants: {
    visible: true,
  },
});
