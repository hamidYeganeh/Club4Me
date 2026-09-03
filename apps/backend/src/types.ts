import type { Env } from "./config/env.js";
import type { AuthTokenPayload } from "./lib/jwt.js";

export type AppEnv = {
  Variables: {
    env: Env;
    user?: AuthTokenPayload;
  };
};
