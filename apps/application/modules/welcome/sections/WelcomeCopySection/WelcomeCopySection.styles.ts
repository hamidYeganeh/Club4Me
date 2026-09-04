import { tv } from "tailwind-variants";

export const welcomeCopySectionStyles = tv({
  slots: {
    root: "relative z-10 -mt-16 flex flex-col items-center rounded-t-[2.5rem] border-t border-white/7 bg-background/92 px-8 pt-10 pb-[max(1.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl",
    copy: "flex w-full max-w-sm flex-col items-center text-center",
    title: "",
    subtitle: "mt-3 max-w-[22rem] leading-7",
    actions: "mt-10 flex w-full max-w-sm flex-col items-center gap-5",
    button: "active:scale-[0.98]",
    signInRow: "",
    signIn:
      "font-semibold text-accent underline decoration-accent/40 decoration-2 underline-offset-4",
  },
});
