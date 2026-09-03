import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(7088),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGODB_URL: z.string().min(1, "MONGODB_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  KAVENEGAR_API_KEY: z.string().optional(),
  KAVENEGAR_OTP_TEMPLATE: z.string().default("verify"),
  KAVENEGAR_RESET_TEMPLATE: z.string().optional(),
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
