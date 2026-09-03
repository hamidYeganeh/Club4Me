import { Hono } from "hono";

import type { AppEnv } from "../../types.js";
import { createAccountRouter } from "./account.js";
import { createDiscoveryRouter } from "./discovery.js";

export function createV1Router() {
  const v1 = new Hono<AppEnv>();

  v1.route("/account", createAccountRouter());
  v1.route("/discovery", createDiscoveryRouter());

  return v1;
}
