import type { AccountUser } from "@api/account";

import type { AccountAuthForgotPasswordConfirmFormValues } from "./AccountAuthForgotPasswordConfirmForm.schema";

export type AccountAuthForgotPasswordConfirmFormProps = {
  formId?: string;
  phone: string;
  codeLabel: string;
  legend: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  passwordConfirmLabel: string;
  passwordConfirmPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  submitLabel: string;
  resendLabel: string;
  resendInPrefix: string;
  resendInSuffix: string;
  codeRequired: string;
  codeInvalid: string;
  passwordRequired: string;
  passwordMin: string;
  passwordMismatch: string;
  sent: string;
  onSuccess: (user: AccountUser) => void;
};

export type { AccountAuthForgotPasswordConfirmFormValues };
