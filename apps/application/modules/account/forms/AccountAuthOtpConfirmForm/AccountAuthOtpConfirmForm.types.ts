import type { AccountUser } from "@api/account";

import type { AccountAuthOtpConfirmFormValues } from "./AccountAuthOtpConfirmForm.schema";

export type AccountAuthOtpConfirmFormProps = {
  formId?: string;
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
  onSuccess: (user: AccountUser) => void;
};

export type { AccountAuthOtpConfirmFormValues };
