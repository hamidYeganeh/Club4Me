import { z } from "zod";

import { isValidIranianPhone } from "@/lib/phone";

export type AccountAuthLoginFormMessages = {
  phoneRequired: string;
  phoneInvalid: string;
  passwordRequired: string;
  passwordMin: string;
};

export function createAccountAuthLoginFormSchema(
  messages: AccountAuthLoginFormMessages,
) {
  return z.object({
    phone: z
      .string()
      .trim()
      .min(1, messages.phoneRequired)
      .refine((value) => isValidIranianPhone(value), {
        message: messages.phoneInvalid,
      }),
    password: z
      .string()
      .min(1, messages.passwordRequired)
      .min(8, messages.passwordMin),
    remember: z.boolean(),
  });
}

export type AccountAuthLoginFormValues = z.infer<
  ReturnType<typeof createAccountAuthLoginFormSchema>
>;
