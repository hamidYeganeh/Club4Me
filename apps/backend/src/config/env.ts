import { z } from "zod";

const envSchema = z
  .object({
    PORT: z.coerce.number().default(7088),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    TRUST_PROXY: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    MONGODB_URL: z.string().min(1, "MONGODB_URL is required"),
    REDIS_URL: z.string().min(1, "REDIS_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
    MOCK_PAYMENT_CALLBACK_SECRET: z
      .string()
      .min(16)
      .default("local-mock-payment-secret"),
    EXPORT_STORAGE_DRIVER: z.enum(["local", "gcs"]).default("local"),
    EXPORT_LOCAL_DIR: z.string().default(".artifacts/exports"),
    EXPORT_GCS_BUCKET: z.string().trim().optional(),
    EXPORT_SIGNED_URL_MINUTES: z.coerce
      .number()
      .int()
      .min(1)
      .max(1440)
      .default(15),
    EXPORT_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
    SUPPORT_SLA_NORMAL_MINUTES: z.coerce.number().int().min(5).default(480),
    SUPPORT_SLA_HIGH_MINUTES: z.coerce.number().int().min(5).default(120),
    SUPPORT_SLA_URGENT_MINUTES: z.coerce.number().int().min(5).default(30),
    APP_RELEASE: z.string().default("development"),
    SENTRY_DSN: z.string().url().optional().or(z.literal("")),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal("")),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
    APIIR_KEY: z.string().optional(),
    KAVENEGAR_API_KEY: z.string().optional(),
    KAVENEGAR_SENDER: z.string().optional(),
    KAVENEGAR_OTP_TEMPLATE: z.string().default("gym4meotp"),
    KAVENEGAR_RESET_TEMPLATE: z.string().optional(),
    KAVENEGAR_BOOKING_CONFIRMED_TEMPLATE: z
      .string()
      .default("gym4mebookingconfirmed"),
    KAVENEGAR_BOOKING_REMINDER_TEMPLATE: z
      .string()
      .default("gym4mebookingreminder"),
    KAVENEGAR_BOOKING_CANCELLED_TEMPLATE: z
      .string()
      .default("gym4mebookingcancelled"),
    KAVENEGAR_BOOKING_RESCHEDULED_TEMPLATE: z
      .string()
      .default("gym4mebookingrescheduled"),
    KAVENEGAR_PAYMENT_FAILED_TEMPLATE: z
      .string()
      .default("gym4mepaymentfailed"),
    KAVENEGAR_PAYOUT_TEMPLATE: z.string().default(""),
    KAVENEGAR_SUPPORT_TEMPLATE: z.string().default(""),
    KAVENEGAR_WAITLIST_TEMPLATE: z.string().default("gym4mewaitlist"),
    KAVENEGAR_OWNER_APPROVED_TEMPLATE: z.string().default(""),
    CORS_ORIGINS: z
      .string()
      .default(
        "http://localhost:7080,http://localhost:7081,http://localhost:7082,http://localhost:7083",
      )
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
  })
  .superRefine((value, context) => {
    if (value.EXPORT_STORAGE_DRIVER === "gcs" && !value.EXPORT_GCS_BUCKET) {
      context.addIssue({
        code: "custom",
        path: ["EXPORT_GCS_BUCKET"],
        message: "EXPORT_GCS_BUCKET is required when GCS storage is enabled",
      });
    }
    if (value.NODE_ENV !== "production") return;
    const requireProductionValue = (
      key: "APP_RELEASE" | "EXPORT_GCS_BUCKET" | "KAVENEGAR_API_KEY",
      invalid: boolean,
      message: string,
    ) => {
      if (!invalid) return;
      context.addIssue({ code: "custom", path: [key], message });
    };
    if (value.EXPORT_STORAGE_DRIVER !== "gcs") {
      context.addIssue({
        code: "custom",
        path: ["EXPORT_STORAGE_DRIVER"],
        message: "EXPORT_STORAGE_DRIVER must be gcs in production",
      });
    }
    requireProductionValue(
      "EXPORT_GCS_BUCKET",
      !value.EXPORT_GCS_BUCKET,
      "EXPORT_GCS_BUCKET is required in production",
    );
    requireProductionValue(
      "APP_RELEASE",
      !value.APP_RELEASE.trim() || value.APP_RELEASE === "development",
      "APP_RELEASE must identify the production release",
    );
    if (
      value.JWT_SECRET.length < 32 ||
      value.JWT_SECRET.includes("change-me")
    ) {
      context.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be a non-placeholder value of 32+ characters",
      });
    }
    if (
      value.MOCK_PAYMENT_CALLBACK_SECRET.length < 32 ||
      value.MOCK_PAYMENT_CALLBACK_SECRET === "local-mock-payment-secret"
    ) {
      context.addIssue({
        code: "custom",
        path: ["MOCK_PAYMENT_CALLBACK_SECRET"],
        message:
          "MOCK_PAYMENT_CALLBACK_SECRET must be a non-placeholder value of 32+ characters",
      });
    }
    if (isLocalServiceUrl(value.MONGODB_URL)) {
      context.addIssue({
        code: "custom",
        path: ["MONGODB_URL"],
        message: "MONGODB_URL must not point to localhost in production",
      });
    }
    if (isLocalServiceUrl(value.REDIS_URL)) {
      context.addIssue({
        code: "custom",
        path: ["REDIS_URL"],
        message: "REDIS_URL must not point to localhost in production",
      });
    }
    if (
      value.CORS_ORIGINS.length === 0 ||
      value.CORS_ORIGINS.some(
        (origin) => !origin.startsWith("https://") || isLocalServiceUrl(origin),
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "CORS_ORIGINS must contain only production HTTPS origins",
      });
    }
    if (!value.KAVENEGAR_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["KAVENEGAR_API_KEY"],
        message: "KAVENEGAR_API_KEY is required in production",
      });
    }
    const hasFirebaseFile = Boolean(value.FIREBASE_SERVICE_ACCOUNT_PATH);
    const hasInlineFirebase = Boolean(
      value.FIREBASE_PROJECT_ID &&
      value.FIREBASE_CLIENT_EMAIL &&
      value.FIREBASE_PRIVATE_KEY,
    );
    if (!hasFirebaseFile && !hasInlineFirebase) {
      context.addIssue({
        code: "custom",
        path: ["FIREBASE_SERVICE_ACCOUNT_PATH"],
        message: "Firebase Admin credentials are required in production",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }

  return parsed.data;
}

export function loadEnv(): Env {
  return parseEnv(process.env);
}

function isLocalServiceUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return /(^|[/@:])(localhost|127\.0\.0\.1)(?=[:/]|$)/i.test(value);
  }
}
