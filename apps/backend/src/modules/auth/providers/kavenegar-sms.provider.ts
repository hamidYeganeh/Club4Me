import { Injectable, Logger } from "@nestjs/common";

import { AppError } from "../../../common/errors/app.exception";
import { toLocalIranianPhone } from "../../../common/utils/phone.util";
import { AppConfigService } from "../../../config/app-config.service";
import type { SmsProvider, SmsPurpose } from "./sms-provider.interface";

type KavenegarResponse = {
  return?: {
    status?: number;
    message?: string;
  };
};

@Injectable()
export class KavenegarSmsProvider implements SmsProvider {
  private readonly logger = new Logger(KavenegarSmsProvider.name);

  constructor(private readonly config: AppConfigService) {}

  async sendOtp(
    phone: string,
    code: string,
    purpose: SmsPurpose,
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

      this.logger.log(
        `[sms] skipped phone=${phone} code=${code} purpose=${purpose}`,
      );
      return;
    }

    const url = new URL(
      `https://api.kavenegar.com/v1/${env.KAVENEGAR_API_KEY}/verify/lookup.json`,
    );
    url.searchParams.set("receptor", toLocalIranianPhone(phone));
    url.searchParams.set("token", code);
    url.searchParams.set("template", this.templateFor(purpose));

    let response: Response;

    try {
      response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(10_000),
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
      this.logger.error(
        `Kavenegar send failed httpStatus=${response.status} status=${status}`,
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
