import type { AccountAuthForgotPasswordFormValues } from "./AccountAuthForgotPasswordForm.schema";

export type AccountAuthForgotPasswordFormProps = {
  phoneLabel: string;
  phonePlaceholder: string;
  submitLabel: string;
  legend: string;
  phoneRequired: string;
  phoneInvalid: string;
  onSuccess: (phone: string) => void;
};

export type { AccountAuthForgotPasswordFormValues };
