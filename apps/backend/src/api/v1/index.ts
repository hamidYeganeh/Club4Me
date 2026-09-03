import { Hono } from "hono";

import type { AppEnv } from "../../types";
import { createDiscoveryRouter } from "./discovery";

export function createV1Router() {
  const v1 = new Hono<AppEnv>();

  v1.route("/discovery", createDiscoveryRouter());

  return v1;
}
