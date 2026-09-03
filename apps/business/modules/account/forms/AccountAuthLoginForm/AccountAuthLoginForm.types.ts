import type { AccountAuthLoginFormValues } from "./AccountAuthLoginForm.schema";

export type AccountAuthLoginFormProps = {
  phoneLabel: string;
  phonePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  rememberLabel: string;
  forgotLabel: string;
  submitLabel: string;
  legend: string;
  phoneRequired: string;
  phoneInvalid: string;
  passwordRequired: string;
  passwordMin: string;
  onSuccess: () => void;
};

export type { AccountAuthLoginFormValues };
