import { Logger } from "@nestjs/common";

import { AppError } from "../../../common/errors/app.exception";
import { AppConfigService } from "../../../config/app-config.service";
import type { Env } from "../../../config/env";
import { KavenegarSmsProvider } from "./kavenegar-sms.provider";

function createProvider(env: Partial<Env>) {
  const config = {
    env: {
      NODE_ENV: "development",
      KAVENEGAR_OTP_TEMPLATE: "verify",
      ...env,
    } as Env,
  } as AppConfigService;

  return new KavenegarSmsProvider(config);
}

describe("KavenegarSmsProvider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("skips sending in development when the API key is missing", async () => {
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    const provider = createProvider({
      NODE_ENV: "development",
      KAVENEGAR_API_KEY: undefined,
    });

    await provider.sendOtp("+989121234567", "12345", "otp");
    expect(log).toHaveBeenCalled();
  });

  it("throws SMS_NOT_CONFIGURED in production without an API key", async () => {
    const provider = createProvider({
      NODE_ENV: "production",
      KAVENEGAR_API_KEY: undefined,
    });

    await expect(
      provider.sendOtp("+989121234567", "12345", "otp"),
    ).rejects.toMatchObject({
      code: "SMS_NOT_CONFIGURED",
      status: 500,
    });
  });

  it("throws SMS_FAILED when Kavenegar returns a non-success status", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ return: { status: 400, message: "failed" } }),
    }) as typeof fetch;

    const error = jest.spyOn(Logger.prototype, "error").mockImplementation();
    const provider = createProvider({
      KAVENEGAR_API_KEY: "super-secret-api-key",
    });

    await expect(
      provider.sendOtp("+989121234567", "12345", "otp"),
    ).rejects.toBeInstanceOf(AppError);

    expect(JSON.stringify(error.mock.calls)).not.toContain(
      "super-secret-api-key",
    );
  });

  it("throws SMS_FAILED when the request times out", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("aborted"));
    const provider = createProvider({
      KAVENEGAR_API_KEY: "super-secret-api-key",
    });

    await expect(
      provider.sendOtp("+989121234567", "12345", "otp"),
    ).rejects.toMatchObject({
      code: "SMS_FAILED",
      status: 502,
    });
  });
});
