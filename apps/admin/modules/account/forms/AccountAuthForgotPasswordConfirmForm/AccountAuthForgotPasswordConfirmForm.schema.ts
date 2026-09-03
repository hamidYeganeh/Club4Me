import { z } from "zod";

export const FORGOT_PASSWORD_OTP_LENGTH = 5;

export type AccountAuthForgotPasswordConfirmFormMessages = {
  codeRequired: string;
  codeInvalid: string;
  passwordRequired: string;
  passwordMin: string;
  passwordMismatch: string;
};

export function createAccountAuthForgotPasswordConfirmFormSchema(
  messages: AccountAuthForgotPasswordConfirmFormMessages,
) {
  return z
    .object({
      code: z
        .string()
        .trim()
        .min(1, messages.codeRequired)
        .regex(
          new RegExp(`^\\d{${FORGOT_PASSWORD_OTP_LENGTH}}$`),
          messages.codeInvalid,
        ),
      password: z
        .string()
        .min(1, messages.passwordRequired)
        .min(8, messages.passwordMin),
      passwordConfirm: z.string().min(1, messages.passwordRequired),
    })
    .refine((values) => values.password === values.passwordConfirm, {
      message: messages.passwordMismatch,
      path: ["passwordConfirm"],
    });
}

export type AccountAuthForgotPasswordConfirmFormValues = z.infer<
  ReturnType<typeof createAccountAuthForgotPasswordConfirmFormSchema>
>;
