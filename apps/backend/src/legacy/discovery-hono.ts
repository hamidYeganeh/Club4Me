import { Hono } from "hono";

import { createDiscoveryRouter } from "../api/v1/discovery";
import type { Env } from "../config/env";
import { errorHandler, notFoundHandler } from "../middleware/error";
import type { AppEnv } from "../types";

export function createDiscoveryHono(env: Env) {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    c.set("env", env);
    await next();
  });

  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  app.route("/", createDiscoveryRouter());

  return app;
}
