import { tv } from "tailwind-variants";

export const welcomeCopySectionStyles = tv({
  slots: {
    root: "relative z-10 -mt-16 flex flex-col items-center px-8 pb-[max(1.75rem,env(safe-area-inset-bottom))]",
    copy: "flex w-full max-w-sm flex-col items-center text-center",
    title: "",
    subtitle: "mt-3 max-w-[22rem]",
    actions: "mt-10 flex w-full max-w-sm flex-col items-center gap-5",
    button: "active:scale-[0.98]",
    signInRow: "",
    signIn:
      "font-semibold text-accent underline decoration-accent decoration-2 underline-offset-4",
  },
});
