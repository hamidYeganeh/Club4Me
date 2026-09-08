import { tv } from "tailwind-variants";

export const welcomeCopySectionStyles = tv({
  slots: {
    root: "app-card relative z-10 flex flex-col items-center px-5 py-6",
    copy: "flex w-full max-w-sm flex-col items-center text-center",
    title: "text-2xl font-extrabold leading-10",
    subtitle: "mt-3 max-w-[22rem] leading-7",
    actions: "mt-6 flex w-full max-w-sm flex-col items-center gap-5",
    button: "active:scale-[0.98]",
    signInRow: "",
    signIn:
      "font-semibold text-accent underline decoration-accent/40 decoration-2 underline-offset-4",
  },
});
