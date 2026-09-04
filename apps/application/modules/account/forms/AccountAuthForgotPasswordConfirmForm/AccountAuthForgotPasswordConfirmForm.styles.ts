import { tv } from "tailwind-variants";

export const accountAuthForgotPasswordConfirmFormStyles = tv({
  slots: {
    root: "mt-2 flex w-full max-w-sm flex-col self-stretch sm:self-center",
    fieldset: "gap-6",
    group: "flex w-full flex-col items-center gap-4",
    otpField: "flex w-full flex-col items-center gap-3",
    otpWrap: "flex w-full justify-center [direction:ltr]",
    otp: "w-full justify-center [direction:ltr]",
    otpGroup: "w-full justify-center gap-3 [direction:ltr]",
    slot:
      "aspect-square size-14 shrink-0 grow-0 basis-14 rounded-2xl text-xl font-semibold sm:size-16 sm:basis-16",
    resend: "px-1 py-0",
    resendTimer: "inline text-sm font-semibold text-accent",
    resendSeconds: "inline-block tabular-nums",
    error: "min-h-5 text-center text-sm text-danger",
    field: "flex w-full flex-col gap-2",
    label: "text-sm font-bold text-foreground",
    inputGroup: "h-16 rounded-2xl border border-border bg-surface shadow-none",
    prefix: "ps-3 text-muted",
    suffix: "pe-1",
    input: "min-w-0 flex-1 text-start text-xl font-medium",
    actions: "w-full",
    button: "active:scale-[0.98]",
  },
});
