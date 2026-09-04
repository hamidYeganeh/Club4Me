import type {
  SmsLookupTokens,
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
  readonly templateCalls: Array<{
    phone: string;
    template: string;
    tokens: SmsLookupTokens;
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

  async sendTemplate(
    phone: string,
    template: string,
    tokens: SmsLookupTokens,
  ): Promise<void> {
    this.templateCalls.push({ phone, template, tokens });
  }
}
