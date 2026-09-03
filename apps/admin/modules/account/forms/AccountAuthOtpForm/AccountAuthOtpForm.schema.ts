import { z } from "zod";

import { isValidIranianPhone } from "@/lib/phone";

export type AccountAuthOtpFormMessages = {
  phoneRequired: string;
  phoneInvalid: string;
};

export function createAccountAuthOtpFormSchema(
  messages: AccountAuthOtpFormMessages,
) {
  return z.object({
    country: z.literal("IR"),
    phone: z
      .string()
      .trim()
      .min(1, messages.phoneRequired)
      .refine((value) => isValidIranianPhone(value), {
        message: messages.phoneInvalid,
      }),
  });
}

export type AccountAuthOtpFormValues = z.infer<
  ReturnType<typeof createAccountAuthOtpFormSchema>
>;
