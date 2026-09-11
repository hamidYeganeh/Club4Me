import { config as loadDotenv } from "dotenv";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { createConfiguredApp } from "../src/bootstrap";

loadDotenv({ path: ".env" });

let appPromise: Promise<NestExpressApplication> | undefined;

async function getApp() {
  appPromise ??= createConfiguredApp().then(async (app) => {
    await app.init();
    return app;
  });

  try {
    return await appPromise;
  } catch (error) {
    appPromise = undefined;
    throw error;
  }
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  const app = await getApp();
  const express = app.getHttpAdapter().getInstance();
  return express(request, response);
}
