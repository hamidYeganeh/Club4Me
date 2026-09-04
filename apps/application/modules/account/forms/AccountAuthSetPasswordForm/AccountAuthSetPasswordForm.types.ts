import type { PasswordStrengthLabel } from "@/lib/password-strength";

import type { AccountAuthSetPasswordFormValues } from "./AccountAuthSetPasswordForm.schema";

export type AccountAuthSetPasswordFormProps = {
  formId?: string;
  legend: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  passwordConfirmLabel: string;
  passwordConfirmPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  submitLabel: string;
  passwordRequired: string;
  passwordMin: string;
  passwordMismatch: string;
  strengthLabels: Record<PasswordStrengthLabel, string>;
  onSuccess: () => void;
};

export type { AccountAuthSetPasswordFormValues };
