import type { AccountAuthLoginFormValues } from "./AccountAuthLoginForm.schema";

export type AccountAuthLoginFormProps = {
  formId: string;
  phoneLabel: string;
  phonePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  rememberLabel: string;
  forgotLabel: string;
  legend: string;
  phoneRequired: string;
  phoneInvalid: string;
  passwordRequired: string;
  passwordMin: string;
  onSuccess: () => void;
  onSubmitStateChange?: (state: {
    isBusy: boolean;
    isPending: boolean;
  }) => void;
};

export type { AccountAuthLoginFormValues };
