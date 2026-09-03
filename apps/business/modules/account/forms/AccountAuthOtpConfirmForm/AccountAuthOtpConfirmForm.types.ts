import type { AccountAuthOtpConfirmFormValues } from "./AccountAuthOtpConfirmForm.schema";

export type AccountAuthOtpConfirmFormProps = {
  phone: string;
  codeLabel: string;
  legend: string;
  resendLabel: string;
  resendInPrefix: string;
  resendInSuffix: string;
  continueLabel: string;
  codeRequired: string;
  codeInvalid: string;
  sent: string;
  onSuccess: () => void;
};

export type { AccountAuthOtpConfirmFormValues };
