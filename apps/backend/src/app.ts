import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createApiRouter } from "./api/index.js";
import type { Env } from "./config/env.js";
import { getDb } from "./db/mongodb.js";
import { getRedis } from "./db/redis.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import type { AppEnv } from "./types.js";

export function createApp(env: Env) {
  const app = new Hono<AppEnv>();

  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGINS,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );
  app.use("*", logger());
  app.use("*", async (c, next) => {
    c.set("env", env);
    await next();
  });

  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  app.get("/", (c) => {
    return c.json({
      name: "Club4Me API",
      version: "0.1.0",
    });
  });

  app.get("/health", async (c) => {
    const mongoPing = await getDb().command({ ping: 1 });
    const redisPing = await getRedis().ping();

    return c.json({
      status: "ok",
      mongo: mongoPing.ok === 1 ? "connected" : "error",
      redis: redisPing === "PONG" ? "connected" : "error",
    });
  });

  app.route("/api", createApiRouter());

  return app;
}
