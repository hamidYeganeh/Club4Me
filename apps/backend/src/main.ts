import "reflect-metadata";
import { config as loadDotenv } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";

loadDotenv({ path: ".env" });

async function bootstrap() {
  const env = loadEnvForObservability();
  if (env.dsn) {
    Sentry.init({
      dsn: env.dsn,
      environment: process.env.NODE_ENV ?? "development",
      release: env.release,
      sendDefaultPii: false,
    });
  }
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.use(helmet());
  if (config.env.TRUST_PROXY) {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.enableCors({
    origin: config.env.CORS_ORIGINS,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.listen(config.env.PORT);
  Logger.log(`Backend running on http://localhost:${config.env.PORT}`);
}

function loadEnvForObservability() {
  return {
    dsn: process.env.SENTRY_DSN?.trim() || undefined,
    release: process.env.APP_RELEASE?.trim() || "development",
  };
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
