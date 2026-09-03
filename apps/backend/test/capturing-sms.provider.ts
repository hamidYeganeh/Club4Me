import type {
  SmsProvider,
  SmsPurpose,
} from "../src/modules/auth/providers/sms-provider.interface";

export class CapturingSmsProvider implements SmsProvider {
  last:
    | {
        phone: string;
        code: string;
        purpose: SmsPurpose;
      }
    | undefined;
  readonly calls: Array<{
    phone: string;
    code: string;
    purpose: SmsPurpose;
  }> = [];

  async sendOtp(
    phone: string,
    code: string,
    purpose: SmsPurpose,
  ): Promise<void> {
    const payload = { phone, code, purpose };
    this.last = payload;
    this.calls.push(payload);
  }
}
