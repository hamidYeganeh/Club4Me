import { parseEnv } from "./env";

const productionEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  PORT: "7088",
  TRUST_PROXY: "true",
  MONGODB_URL: "mongodb+srv://app:secret@cluster.example/gym4me",
  REDIS_URL: "rediss://app:secret@redis.example:6380",
  JWT_SECRET: "a-production-jwt-secret-with-32-characters",
  MOCK_PAYMENT_CALLBACK_SECRET:
    "a-production-callback-secret-with-32-characters",
  EXPORT_STORAGE_DRIVER: "gcs",
  EXPORT_GCS_BUCKET: "gym4me-production-exports",
  APP_RELEASE: "2026.09.05-1",
  SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
  FIREBASE_PROJECT_ID: "gym4me-production",
  FIREBASE_CLIENT_EMAIL: "firebase-admin@example.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: "private-key",
  KAVENEGAR_API_KEY: "kavenegar-api-key",
  CORS_ORIGINS: "https://gym4me.ir,https://admin.gym4me.ir",
};

describe("production environment", () => {
  it("accepts a complete production configuration", () => {
    expect(parseEnv(productionEnv)).toMatchObject({
      NODE_ENV: "production",
      EXPORT_STORAGE_DRIVER: "gcs",
      APP_RELEASE: "2026.09.05-1",
    });
  });

  it("allows the exact Capacitor Android origin when explicitly configured", () => {
    expect(
      parseEnv({
        ...productionEnv,
        CORS_ORIGINS: `${productionEnv.CORS_ORIGINS},https://localhost`,
      }).CORS_ORIGINS,
    ).toContain("https://localhost");
  });

  it.each([
    ["KAVENEGAR_API_KEY", ""],
    ["EXPORT_STORAGE_DRIVER", "local"],
    ["EXPORT_GCS_BUCKET", ""],
    ["APP_RELEASE", "development"],
    ["JWT_SECRET", "change-me-in-production"],
    ["MONGODB_URL", "mongodb://localhost:27017/gym4me"],
    ["REDIS_URL", "redis://127.0.0.1:6379"],
    ["CORS_ORIGINS", "http://localhost:7081"],
    ["CORS_ORIGINS", "https://localhost:7081"],
    ["CORS_ORIGINS", "https://127.0.0.1"],
  ])("rejects unsafe %s", (key, value) => {
    expect(() => parseEnv({ ...productionEnv, [key]: value })).toThrow(
      "Invalid environment variables",
    );
  });

  it("requires one complete Firebase credential source", () => {
    expect(() =>
      parseEnv({
        ...productionEnv,
        FIREBASE_PROJECT_ID: "",
        FIREBASE_CLIENT_EMAIL: "",
        FIREBASE_PRIVATE_KEY: "",
      }),
    ).toThrow("Firebase Admin credentials are required in production");
  });
});

describe("development environment", () => {
  it("allows every local web and native development server by default", () => {
    const { CORS_ORIGINS } = parseEnv({
      MONGODB_URL: "mongodb://localhost:27017/gym4me",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "development-secret",
    });

    expect(CORS_ORIGINS).toEqual(
      expect.arrayContaining([
        "http://localhost:7080",
        "http://localhost:7081",
        "http://localhost:7082",
        "http://localhost:7083",
        "http://localhost:7091",
        "http://127.0.0.1:7080",
        "http://127.0.0.1:7081",
        "http://127.0.0.1:7082",
        "http://127.0.0.1:7083",
        "http://127.0.0.1:7091",
      ]),
    );
  });
});
