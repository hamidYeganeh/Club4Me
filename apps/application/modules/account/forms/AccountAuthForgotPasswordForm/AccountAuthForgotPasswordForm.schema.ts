import { z } from "zod";

import { isValidIranianPhone } from "@/lib/phone";

export type AccountAuthForgotPasswordFormMessages = {
  phoneRequired: string;
  phoneInvalid: string;
};

export function createAccountAuthForgotPasswordFormSchema(
  messages: AccountAuthForgotPasswordFormMessages,
) {
  return z.object({
    phone: z
      .string()
      .trim()
      .min(1, messages.phoneRequired)
      .refine((value) => isValidIranianPhone(value), {
        message: messages.phoneInvalid,
      }),
  });
}

export type AccountAuthForgotPasswordFormValues = z.infer<
  ReturnType<typeof createAccountAuthForgotPasswordFormSchema>
>;
