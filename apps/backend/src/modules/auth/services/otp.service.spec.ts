import { AppError } from "../../../common/errors/app.exception";
import { InMemoryRedis } from "../../../infrastructure/redis/in-memory-redis";
import { RedisService } from "../../../infrastructure/redis/redis.service";
import { OTP_TTL_SECONDS, OtpService, challengeKey } from "./otp.service";

describe("OtpService", () => {
  let redis: InMemoryRedis;
  let otpService: OtpService;

  beforeEach(() => {
    redis = new InMemoryRedis();
    otpService = new OtpService(new RedisService(redis));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates a 5-digit OTP that expires after the TTL", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const { result, code } = await otpService.request("+989121234567", "login");

    expect(result.expiresIn).toBe(OTP_TTL_SECONDS);
    expect(code).toMatch(/^\d{5}$/);

    jest.setSystemTime(new Date("2026-01-01T00:05:01.000Z"));

    await expect(
      otpService.consume("+989121234567", code, "login"),
    ).rejects.toMatchObject({ code: "OTP_EXPIRED", status: 400 });
  });

  it("rate limits OTP requests", async () => {
    const phone = "+989121234568";

    for (let i = 0; i < 5; i += 1) {
      await otpService.request(phone, "login");
    }

    await expect(otpService.request(phone, "login")).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    });
  });

  it("invalidates the challenge after five failed attempts", async () => {
    const phone = "+989121234569";
    await otpService.request(phone, "login");

    for (let i = 0; i < 4; i += 1) {
      await expect(
        otpService.consume(phone, "00000", "login"),
      ).rejects.toBeInstanceOf(AppError);
    }

    await expect(
      otpService.consume(phone, "00000", "login"),
    ).rejects.toMatchObject({
      code: "OTP_INVALID",
    });

    await expect(
      otpService.consume(phone, "00000", "login"),
    ).rejects.toMatchObject({
      code: "OTP_EXPIRED",
    });
  });

  it("preserves TTL after a failed attempt", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const phone = "+989121234570";
    await otpService.request(phone, "login");

    jest.setSystemTime(new Date("2026-01-01T00:01:00.000Z"));
    await expect(
      otpService.consume(phone, "00000", "login"),
    ).rejects.toMatchObject({
      code: "OTP_INVALID",
    });

    const ttl = await redis.pttl(challengeKey("login", phone));
    expect(ttl).toBeGreaterThan(3 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(4 * 60 * 1000);
  });

  it("allows an OTP to be consumed only once", async () => {
    const phone = "+989121234571";
    const { code } = await otpService.request(phone, "login");

    await otpService.consume(phone, code, "login");
    await expect(
      otpService.consume(phone, code, "login"),
    ).rejects.toMatchObject({
      code: "OTP_EXPIRED",
    });
    await expect(redis.get(challengeKey("login", phone))).resolves.toBeNull();
  });
});
