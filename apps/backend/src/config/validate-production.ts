import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnv } from "./env";

loadDotenv({ path: ".env" });

const env = loadEnv();
const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

if (serviceAccountPath && !existsSync(resolve(serviceAccountPath))) {
  throw new Error(
    `FIREBASE_SERVICE_ACCOUNT_PATH does not exist: ${serviceAccountPath}`,
  );
}

console.log(
  `[production-config] valid release=${env.APP_RELEASE} storage=${env.EXPORT_STORAGE_DRIVER}`,
);
