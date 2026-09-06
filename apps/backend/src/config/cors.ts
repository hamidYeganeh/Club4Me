import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

import type { Env } from "./env";

export function corsOriginFor(
  _env: Pick<Env, "NODE_ENV" | "CORS_ORIGINS">,
): CorsOptions["origin"] {
  // Reflect every request Origin in every environment. This deliberately makes
  // the API consumable by debug WebViews, LAN hosts and third-party web origins.
  // Reflection is required because credentials cannot be combined with `*`.
  return true;
}

export function corsOptionsFor(
  env: Pick<Env, "NODE_ENV" | "CORS_ORIGINS">,
): CorsOptions {
  return {
    origin: corsOriginFor(env),
    credentials: true,
    // Let the CORS middleware reflect requested headers from already-trusted
    // origins so adding a client header cannot silently break preflight later.
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  };
}
