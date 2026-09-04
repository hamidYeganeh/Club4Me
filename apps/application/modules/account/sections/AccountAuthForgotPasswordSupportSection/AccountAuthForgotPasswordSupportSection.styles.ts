import { tv } from "tailwind-variants";

export const accountAuthForgotPasswordSupportSectionStyles = tv({
  slots: {
    root: "mt-6 flex flex-col items-center gap-1 text-center",
    email:
      "font-semibold text-accent underline decoration-accent decoration-2 underline-offset-4",
  },
});
