import { z } from "zod";

const envSchema = z.object({
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
  EXPORT_SIGNED_URL_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  SUPPORT_SLA_NORMAL_MINUTES: z.coerce.number().int().min(5).default(480),
  SUPPORT_SLA_HIGH_MINUTES: z.coerce.number().int().min(5).default(120),
  SUPPORT_SLA_URGENT_MINUTES: z.coerce.number().int().min(5).default(30),
  APP_RELEASE: z.string().default("development"),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal("")),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
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
  KAVENEGAR_PAYMENT_FAILED_TEMPLATE: z.string().default("gym4mepaymentfailed"),
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
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }

  return parsed.data;
}
