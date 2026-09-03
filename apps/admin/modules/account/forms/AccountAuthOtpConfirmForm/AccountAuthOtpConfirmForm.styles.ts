import { tv } from "tailwind-variants";

export const accountAuthOtpConfirmFormStyles = tv({
  slots: {
    root: "mt-6 flex w-full max-w-md flex-col self-stretch",
    fieldset: "gap-8",
    group: "flex w-full flex-col items-center gap-4",
    field: "flex w-full flex-col items-center gap-3",
    otpWrap: "flex w-full justify-center [direction:ltr]",
    otp: "w-full justify-center [direction:ltr]",
    otpGroup: "w-full justify-center gap-3 [direction:ltr]",
    slot:
      "aspect-square size-14 shrink-0 grow-0 basis-14 rounded-2xl text-xl font-bold sm:size-16 sm:basis-16",
    resend: "px-1 py-0",
    resendTimer: "inline text-sm font-semibold text-accent",
    resendSeconds: "inline-block tabular-nums",
    error: "min-h-5 text-center text-sm text-danger",
    actions: "w-full",
    button: "active:scale-[0.98]",
  },
});
