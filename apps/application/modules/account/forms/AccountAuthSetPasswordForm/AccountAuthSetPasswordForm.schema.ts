import { z } from "zod";

export type AccountAuthSetPasswordFormMessages = {
  passwordRequired: string;
  passwordMin: string;
  passwordMismatch: string;
};

export function createAccountAuthSetPasswordFormSchema(
  messages: AccountAuthSetPasswordFormMessages,
) {
  return z
    .object({
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

export type AccountAuthSetPasswordFormValues = z.infer<
  ReturnType<typeof createAccountAuthSetPasswordFormSchema>
>;
