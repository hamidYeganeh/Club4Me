import { Injectable, Logger } from "@nestjs/common";

import { AppError } from "../../../common/errors/app.exception";
import { toLocalIranianPhone } from "../../../common/utils/phone.util";
import { AppConfigService } from "../../../config/app-config.service";
import type {
  SmsLookupTokens,
  SmsProvider,
  SmsPurpose,
} from "./sms-provider.interface";

type KavenegarResponse = {
  return?: {
    status?: number;
    message?: string;
  };
};

// Kavenegar lookup requests can take more than ten seconds while the provider
// hands the message off to the mobile operator. Do not turn a slow, otherwise
// successful handoff into an SMS_FAILED response.
const KAVENEGAR_REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class KavenegarSmsProvider implements SmsProvider {
  private readonly logger = new Logger(KavenegarSmsProvider.name);

  constructor(private readonly config: AppConfigService) {}

  async sendOtp(
    phone: string,
    code: string,
    purpose: SmsPurpose,
  ): Promise<void> {
    return this.sendTemplate(phone, this.templateFor(purpose), {
      token: code,
    });
  }

  async sendTemplate(
    phone: string,
    template: string,
    tokens: SmsLookupTokens,
  ): Promise<void> {
    const env = this.config.env;

    if (!env.KAVENEGAR_API_KEY) {
      if (env.NODE_ENV === "production") {
        throw new AppError(
          500,
          "SMS_NOT_CONFIGURED",
          "SMS provider is not configured",
        );
      }

      this.logger.log(`[sms] skipped phone=${phone} template=${template}`);
      return;
    }

    const url = new URL(
      `https://api.kavenegar.com/v1/${env.KAVENEGAR_API_KEY}/verify/lookup.json`,
    );
    url.searchParams.set("receptor", toLocalIranianPhone(phone));
    url.searchParams.set("template", template);
    for (const [key, value] of Object.entries(tokens)) {
      if (value) url.searchParams.set(key, value);
    }

    let response: Response;

    try {
      response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(KAVENEGAR_REQUEST_TIMEOUT_MS),
      });
    } catch {
      this.logger.error("Kavenegar request failed");
      throw new AppError(502, "SMS_FAILED", "Failed to send verification SMS");
    }

    let body: KavenegarResponse = {};

    try {
      body = (await response.json()) as KavenegarResponse;
    } catch {
      body = {};
    }

    const status = body.return?.status ?? response.status;

    if (!response.ok || status !== 200) {
      const providerMessage = body.return?.message?.trim();
      this.logger.error(
        [
          "Kavenegar send failed",
          `httpStatus=${response.status}`,
          `status=${status}`,
          providerMessage ? `message=${JSON.stringify(providerMessage)}` : null,
        ]
          .filter(Boolean)
          .join(" "),
      );
      throw new AppError(502, "SMS_FAILED", "Failed to send verification SMS");
    }
  }

  private templateFor(purpose: SmsPurpose): string {
    const env = this.config.env;

    if (purpose === "reset") {
      return env.KAVENEGAR_RESET_TEMPLATE ?? env.KAVENEGAR_OTP_TEMPLATE;
    }

    return env.KAVENEGAR_OTP_TEMPLATE;
  }
}
