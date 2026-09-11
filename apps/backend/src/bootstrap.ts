import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import * as Sentry from "@sentry/node";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";
import { corsOptionsFor } from "./config/cors";

let observabilityConfigured = false;

export async function createConfiguredApp() {
  configureObservability();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(AppConfigService);

  app.useBodyParser("json", { limit: "15mb" });
  app.use(helmet());
  if (config.env.TRUST_PROXY) {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.enableCors(corsOptionsFor(config.env));

  return app;
}

function configureObservability() {
  if (observabilityConfigured) return;
  observabilityConfigured = true;

  const dsn = process.env.SENTRY_DSN?.trim() || undefined;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      release: process.env.APP_RELEASE?.trim() || "development",
      sendDefaultPii: false,
    });
  } else if (process.env.NODE_ENV === "production") {
    Logger.warn(
      "Sentry is not configured; production error reporting is disabled",
    );
  }
}
