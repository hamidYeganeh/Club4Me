import { z } from "zod";

export const OTP_CODE_LENGTH = 5;

export type AccountAuthOtpConfirmFormMessages = {
  codeRequired: string;
  codeInvalid: string;
};

export function createAccountAuthOtpConfirmFormSchema(
  messages: AccountAuthOtpConfirmFormMessages,
) {
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, messages.codeRequired)
      .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), messages.codeInvalid),
  });
}

export type AccountAuthOtpConfirmFormValues = z.infer<
  ReturnType<typeof createAccountAuthOtpConfirmFormSchema>
>;
