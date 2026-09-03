import type { Context } from "hono";
import { createMiddleware } from "hono/factory";

import { AppError } from "../lib/errors.js";
import { verifyToken } from "../lib/jwt.js";
import type { AppEnv } from "../types.js";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  try {
    const payload = verifyToken(c.get("env"), header.slice(7));
    c.set("user", payload);
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }

  await next();
});

export function getAuthUser(c: Context<AppEnv>) {
  const user = c.get("user");

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  return user;
}
