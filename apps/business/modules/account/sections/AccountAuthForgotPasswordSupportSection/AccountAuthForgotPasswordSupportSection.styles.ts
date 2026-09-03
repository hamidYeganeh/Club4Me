import { tv } from "tailwind-variants";

export const accountAuthForgotPasswordSupportSectionStyles = tv({
  slots: {
    root: "mt-auto flex flex-col items-center gap-1 pt-10 text-center text-sm text-muted",
    email:
      "font-semibold text-accent underline decoration-accent decoration-2 underline-offset-4",
  },
});
