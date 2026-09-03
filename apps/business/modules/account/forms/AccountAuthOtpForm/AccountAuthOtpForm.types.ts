import type { AccountAuthOtpFormValues } from "./AccountAuthOtpForm.schema";

export type AccountAuthOtpFormProps = {
  phoneLabel: string;
  phonePlaceholder: string;
  countryLabel: string;
  iranLabel: string;
  continueLabel: string;
  legend: string;
  phoneRequired: string;
  phoneInvalid: string;
  onSuccess: (phone: string) => void;
};

export type { AccountAuthOtpFormValues };
