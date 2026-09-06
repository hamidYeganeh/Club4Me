import { tv } from "tailwind-variants";

export const accountAuthForgotPasswordConfirmFormStyles = tv({
  slots: {
    root: "mt-12 flex w-full shrink-0 flex-col max-[700px]:mt-10",
    fieldset: "gap-4",
    group: "flex w-full flex-col items-center gap-3",
    otpField: "flex w-full flex-col items-center gap-3",
    otpWrap: "flex w-full justify-center [direction:ltr]",
    otp: "w-full justify-center [direction:ltr]",
    otpGroup:
      "w-full justify-between gap-2 [direction:ltr] sm:justify-center sm:gap-3",
    slot:
      "aspect-square h-16 w-auto min-w-0 flex-1 basis-0 rounded-2xl border border-border bg-surface text-xl font-medium shadow-none sm:size-16 sm:flex-none sm:basis-16",
    resend:
      "h-auto min-h-0 px-1 py-0 text-sm text-muted data-[ready=true]:text-accent",
    resendTimer: "inline text-sm font-medium text-muted",
    resendSeconds: "inline-block tabular-nums text-accent",
    error: "min-h-5 text-center text-sm text-danger",
    field: "w-full",
    inputGroup: "h-16 w-full rounded-2xl border border-border bg-surface shadow-none",
    suffix: "pe-2",
    input: "min-w-0 flex-1 px-4 text-start text-base font-medium tracking-wide",
    actions: "mt-4 w-full",
    button: "h-16 w-full active:scale-[0.98]",
  },
});
