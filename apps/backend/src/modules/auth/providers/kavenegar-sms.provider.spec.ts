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

    expect(error).toHaveBeenCalledWith(
      'Kavenegar send failed httpStatus=500 status=400 message="failed"',
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain(
      "super-secret-api-key",
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain("12345");
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

  it("maps workbook lookup placeholders to Kavenegar token parameters", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ return: { status: 200 } }),
    });
    globalThis.fetch = fetchMock as typeof fetch;
    const provider = createProvider({
      KAVENEGAR_API_KEY: "super-secret-api-key",
    });

    await provider.sendTemplate("+989121234567", "gym4mebookingrescheduled", {
      token: "a1b2c3d4",
      token10: "۱۴۰۵/۰۶/۱۲ ۱۸:۳۰",
    });

    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.pathname).toContain("/verify/lookup.json");
    expect(requestedUrl.searchParams.get("receptor")).toBe("09121234567");
    expect(requestedUrl.searchParams.get("template")).toBe(
      "gym4mebookingrescheduled",
    );
    expect(requestedUrl.searchParams.get("token")).toBe("a1b2c3d4");
    expect(requestedUrl.searchParams.get("token10")).toBe("۱۴۰۵/۰۶/۱۲ ۱۸:۳۰");
  });

  it("sends transactional text when a dedicated lookup template is unavailable", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ return: { status: 200 } }),
    });
    globalThis.fetch = fetchMock as typeof fetch;
    const provider = createProvider({
      KAVENEGAR_API_KEY: "super-secret-api-key",
    });

    await provider.sendMessage("+989121234567", "وضعیت تیکت به‌روزرسانی شد");

    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.pathname).toContain("/sms/send.json");
    expect(requestedUrl.searchParams.get("receptor")).toBe("09121234567");
    expect(requestedUrl.searchParams.get("message")).toBe(
      "وضعیت تیکت به‌روزرسانی شد",
    );
  });
});
