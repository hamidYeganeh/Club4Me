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
      "size-16 shrink-0 grow-0 basis-16 rounded-2xl text-xl font-bold",
    resend:
      "h-auto min-h-0 px-1 py-0 text-sm font-semibold text-accent",
    resendTimer: "inline text-sm font-semibold text-accent",
    resendSeconds: "inline-block tabular-nums",
    error: "min-h-5 text-center text-sm text-danger",
    actions: "w-full",
    button: "h-14 rounded-full text-base font-bold active:scale-[0.98]",
  },
});
