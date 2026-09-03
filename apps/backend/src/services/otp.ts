import { getRedis } from "../db/redis.js";
import { AppError } from "../lib/errors.js";

export const OTP_TTL_SECONDS = 300;
const OTP_RATE_WINDOW_SECONDS = 60;
const OTP_RATE_LIMIT = 5;
const OTP_MAX_ATTEMPTS = 5;

export type OtpPurpose = "login" | "reset";

type OtpChallenge = {
  phone: string;
  code: string;
  attempts: number;
};

export type RequestOtpResult = {
  expiresIn: number;
};

function challengeKey(purpose: OtpPurpose, phone: string): string {
  return `otp:${purpose}:${phone}`;
}

function rateKey(purpose: OtpPurpose, phone: string): string {
  return `otp:rate:${purpose}:${phone}`;
}

function randomCode(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export async function requestOtp(
  phone: string,
  purpose: OtpPurpose,
): Promise<{ result: RequestOtpResult; code: string }> {
  const redis = getRedis();
  const count = await redis.incr(rateKey(purpose, phone));

  if (count === 1) {
    await redis.expire(rateKey(purpose, phone), OTP_RATE_WINDOW_SECONDS);
  }

  if (count > OTP_RATE_LIMIT) {
    throw new AppError(429, "RATE_LIMITED", "Too many OTP requests");
  }

  const code = randomCode();
  const challenge: OtpChallenge = { phone, code, attempts: 0 };

  await redis.set(
    challengeKey(purpose, phone),
    JSON.stringify(challenge),
    "EX",
    OTP_TTL_SECONDS,
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(`[otp] purpose=${purpose} phone=${phone} code=${code}`);
  }

  return {
    result: { expiresIn: OTP_TTL_SECONDS },
    code,
  };
}

export async function consumeOtp(
  phone: string,
  code: string,
  purpose: OtpPurpose,
): Promise<void> {
  const redis = getRedis();
  const key = challengeKey(purpose, phone);
  const raw = await redis.get(key);

  if (!raw) {
    throw new AppError(400, "OTP_EXPIRED", "OTP expired or invalid");
  }

  const challenge = JSON.parse(raw) as OtpChallenge;

  if (challenge.phone !== phone || challenge.code !== code) {
    const attempts = challenge.attempts + 1;

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redis.del(key);
      throw new AppError(400, "OTP_INVALID", "Invalid OTP code");
    }

    const ttl = await redis.pttl(key);

    if (ttl <= 0) {
      await redis.del(key);
      throw new AppError(400, "OTP_EXPIRED", "OTP expired or invalid");
    }

    await redis.set(
      key,
      JSON.stringify({ ...challenge, attempts }),
      "PX",
      Math.max(ttl, 1),
    );

    throw new AppError(400, "OTP_INVALID", "Invalid OTP code");
  }

  await redis.del(key);
}
