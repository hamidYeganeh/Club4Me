import { Hono } from "hono";

import { API_VERSIONS, CURRENT_API_VERSION, ok } from "../lib/http.js";
import type { AppEnv } from "../types.js";
import { createV1Router } from "./v1/index.js";

export function createApiRouter() {
  const api = new Hono<AppEnv>();

  api.get("/", (c) => {
    return ok(c, {
      current: CURRENT_API_VERSION,
      versions: API_VERSIONS,
    });
  });

  api.route(`/${CURRENT_API_VERSION}`, createV1Router());

  return api;
}
