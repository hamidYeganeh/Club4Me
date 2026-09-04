import type { AccountAuthOtpFormValues } from "./AccountAuthOtpForm.schema";

export type AccountAuthOtpFormProps = {
  formId: string;
  phoneLabel: string;
  phonePlaceholder: string;
  legend: string;
  phoneRequired: string;
  phoneInvalid: string;
  onSuccess: (phone: string) => void;
  onSubmitStateChange?: (state: {
    isBusy: boolean;
    isPending: boolean;
  }) => void;
};

export type { AccountAuthOtpFormValues };
