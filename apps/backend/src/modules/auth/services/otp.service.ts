import { randomInt, timingSafeEqual } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { AppError } from "../../../common/errors/app.exception";
import { RedisService } from "../../../infrastructure/redis/redis.service";

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

@Injectable()
export class OtpService {
  constructor(private readonly redis: RedisService) {}

  async request(
    phone: string,
    purpose: OtpPurpose,
  ): Promise<{ result: RequestOtpResult; code: string }> {
    const count = await this.redis.incr(rateKey(purpose, phone));

    if (count === 1) {
      await this.redis.expire(rateKey(purpose, phone), OTP_RATE_WINDOW_SECONDS);
    }

    if (count > OTP_RATE_LIMIT) {
      throw new AppError(429, "RATE_LIMITED", "Too many OTP requests");
    }

    const code = randomOtpCode();
    const challenge: OtpChallenge = { phone, code, attempts: 0 };

    await this.redis.set(
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

  async consume(
    phone: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const key = challengeKey(purpose, phone);
    const raw = await this.redis.get(key);

    if (!raw) {
      throw new AppError(400, "OTP_EXPIRED", "OTP expired or invalid");
    }

    const challenge = JSON.parse(raw) as OtpChallenge;

    if (challenge.phone !== phone || !otpCodesEqual(challenge.code, code)) {
      const attempts = challenge.attempts + 1;

      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.redis.del(key);
        throw new AppError(400, "OTP_INVALID", "Invalid OTP code");
      }

      const ttl = await this.redis.pttl(key);

      if (ttl <= 0) {
        await this.redis.del(key);
        throw new AppError(400, "OTP_EXPIRED", "OTP expired or invalid");
      }

      await this.redis.set(
        key,
        JSON.stringify({ ...challenge, attempts }),
        "PX",
        Math.max(ttl, 1),
      );

      throw new AppError(400, "OTP_INVALID", "Invalid OTP code");
    }

    await this.redis.del(key);
  }
}

export function challengeKey(purpose: OtpPurpose, phone: string): string {
  return `otp:${purpose}:${phone}`;
}

export function rateKey(purpose: OtpPurpose, phone: string): string {
  return `otp:rate:${purpose}:${phone}`;
}

export function randomOtpCode(): string {
  return String(randomInt(10000, 100000));
}

function otpCodesEqual(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
