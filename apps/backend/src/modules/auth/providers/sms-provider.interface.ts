export type SmsPurpose = "otp" | "reset";
export type SmsLookupTokens = {
  token: string;
  token10?: string;
  token20?: string;
};

export interface SmsProvider {
  sendOtp(phone: string, code: string, purpose: SmsPurpose): Promise<void>;
  sendMessage?(phone: string, message: string): Promise<void>;
  sendTemplate(
    phone: string,
    template: string,
    tokens: SmsLookupTokens,
  ): Promise<void>;
}

export const SMS_PROVIDER = "SMS_PROVIDER";
