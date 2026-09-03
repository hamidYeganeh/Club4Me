import type { Env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { toLocalIranianPhone } from "../lib/phone.js";

type KavenegarResponse = {
  return?: {
    status?: number;
    message?: string;
  };
};

export type SmsPurpose = "otp" | "reset";

function templateFor(env: Env, purpose: SmsPurpose): string {
  if (purpose === "reset") {
    return env.KAVENEGAR_RESET_TEMPLATE ?? env.KAVENEGAR_OTP_TEMPLATE;
  }

  return env.KAVENEGAR_OTP_TEMPLATE;
}

export async function sendOtpSms(
  env: Env,
  phone: string,
  code: string,
  purpose: SmsPurpose,
): Promise<void> {
  if (!env.KAVENEGAR_API_KEY) {
    if (env.NODE_ENV === "production") {
      throw new AppError(500, "SMS_NOT_CONFIGURED", "SMS provider is not configured");
    }

    console.log(`[sms] skipped phone=${phone} code=${code} purpose=${purpose}`);
    return;
  }

  const url = new URL(
    `https://api.kavenegar.com/v1/${env.KAVENEGAR_API_KEY}/verify/lookup.json`,
  );
  url.searchParams.set("receptor", toLocalIranianPhone(phone));
  url.searchParams.set("token", code);
  url.searchParams.set("template", templateFor(env, purpose));

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("Kavenegar request failed", error);
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
    console.error("Kavenegar send failed", {
      httpStatus: response.status,
      status,
      message: body.return?.message,
    });
    throw new AppError(502, "SMS_FAILED", "Failed to send verification SMS");
  }
}
