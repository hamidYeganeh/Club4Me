#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inputDir = resolve(root, ".deploy-input");
const target = resolve(root, ".env.production");
const backendInput = readEnv(resolve(inputDir, "backend.env"));
const applicationInput = readEnv(resolve(inputDir, "application.env"));
const adminInput = readEnv(resolve(inputDir, "admin.env"));
const previous = existsSync(target) ? readEnv(target) : {};
const firebase = readJson(
  resolve(root, ".secrets/firebase-service-account.json"),
);
const googleServices = readJson(resolve(inputDir, "google-services.json"));
const release = process.argv[2]?.trim() || new Date().toISOString();

const mongoUser = previous.MONGO_ROOT_USERNAME || "club4me";
const mongoPassword = previous.MONGO_ROOT_PASSWORD || secret();
const redisPassword = previous.REDIS_PASSWORD || secret();
const sentryDsn =
  applicationInput.NEXT_PUBLIC_SENTRY_DSN || previous.SENTRY_DSN || "";
const storageBucket = required(
  googleServices.project_info?.storage_bucket,
  "Firebase storage bucket",
);

const values = {
  PORT: "7088",
  NODE_ENV: "production",
  TRUST_PROXY: "true",
  MONGO_ROOT_USERNAME: mongoUser,
  MONGO_ROOT_PASSWORD: mongoPassword,
  REDIS_PASSWORD: redisPassword,
  MONGODB_URL: `mongodb://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@mongodb:27017/gym4me?authSource=admin`,
  REDIS_URL: `redis://:${encodeURIComponent(redisPassword)}@redis:6379`,
  JWT_SECRET: previous.JWT_SECRET || secret(),
  JWT_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "30d",
  MOCK_PAYMENT_CALLBACK_SECRET:
    previous.MOCK_PAYMENT_CALLBACK_SECRET || secret(),
  EXPORT_STORAGE_DRIVER: "gcs",
  EXPORT_GCS_BUCKET: storageBucket,
  EXPORT_SIGNED_URL_MINUTES: "15",
  EXPORT_TTL_HOURS: "24",
  SUPPORT_SLA_NORMAL_MINUTES: "480",
  SUPPORT_SLA_HIGH_MINUTES: "120",
  SUPPORT_SLA_URGENT_MINUTES: "30",
  APP_RELEASE: release,
  SENTRY_DSN: sentryDsn,
  FIREBASE_PROJECT_ID: required(firebase.project_id, "Firebase project id"),
  FIREBASE_SERVICE_ACCOUNT_PATH: "/run/secrets/firebase-service-account.json",
  KAVENEGAR_API_KEY: required(
    backendInput.KAVENEGAR_API_KEY,
    "Kavenegar API key",
  ),
  KAVENEGAR_SENDER:
    backendInput.KAVENEGAR_SENDER || previous.KAVENEGAR_SENDER || "",
  KAVENEGAR_OTP_TEMPLATE: backendInput.KAVENEGAR_OTP_TEMPLATE || "gym4meotp",
  KAVENEGAR_RESET_TEMPLATE:
    backendInput.KAVENEGAR_RESET_TEMPLATE || "gym4meotp",
  KAVENEGAR_BOOKING_CONFIRMED_TEMPLATE: "gym4mebookingconfirmed",
  KAVENEGAR_BOOKING_REMINDER_TEMPLATE: "gym4mebookingreminder",
  KAVENEGAR_BOOKING_CANCELLED_TEMPLATE: "gym4mebookingcancelled",
  KAVENEGAR_BOOKING_RESCHEDULED_TEMPLATE: "gym4mebookingrescheduled",
  KAVENEGAR_PAYMENT_FAILED_TEMPLATE: "gym4mepaymentfailed",
  KAVENEGAR_WAITLIST_TEMPLATE: "gym4mewaitlist",
  CORS_ORIGINS:
    "https://gym4me.ir,https://www.gym4me.ir,https://app.gym4me.ir,https://admin.gym4me.ir",
  NEXT_PUBLIC_API_URL: "https://api.gym4me.ir/api/v1",
  NEXT_PUBLIC_WEBSITE_URL: "https://gym4me.ir",
  NEXT_PUBLIC_APP_RELEASE: release,
  NEXT_PUBLIC_NESHAN_MAP_KEY: required(
    applicationInput.NEXT_PUBLIC_NESHAN_MAP_KEY,
    "Neshan map key",
  ),
  NEXT_PUBLIC_SENTRY_DSN: sentryDsn,
  NEXT_PUBLIC_TINYMCE_API_KEY: adminInput.NEXT_PUBLIC_TINYMCE_API_KEY || "",
  NEXT_PUBLIC_API_TIMEOUT_MS: "15000",
  NEXT_PUBLIC_BASE_PATH: "/business",
};

const temporary = `${target}.tmp`;
writeFileSync(
  temporary,
  `${Object.entries(values)
    .map(([key, value]) => `${key}=${singleLine(value, key)}`)
    .join("\n")}\n`,
  { mode: 0o600 },
);
renameSync(temporary, target);

console.log(
  `[production-env] ready release=${release} sentry=${sentryDsn ? "configured" : "missing"}`,
);

function secret() {
  return randomBytes(32).toString("hex");
}

function readEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

function readJson(path) {
  if (!existsSync(path)) throw new Error(`Required input is missing: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function required(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

function singleLine(value, key) {
  const normalized = String(value);
  if (/\r|\n/.test(normalized)) {
    throw new Error(`${key} must be a single-line value`);
  }
  return normalized;
}
