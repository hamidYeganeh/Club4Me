export type SmsPurpose = "otp" | "reset";

export interface SmsProvider {
  sendOtp(phone: string, code: string, purpose: SmsPurpose): Promise<void>;
}

export const SMS_PROVIDER = "SMS_PROVIDER";
