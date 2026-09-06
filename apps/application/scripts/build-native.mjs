import { build } from "vite";
import { cpSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { appDirectory, nativeUpdateConfiguration } from "./native-runtime.mjs";

if (process.env.CAPACITOR_SERVER_URL || process.env.CAPACITOR_DEV_URL)
  throw new Error(
    "A local native release cannot contain a hosted or development server URL",
  );
await build({ configFile: resolve(appDirectory, "vite.config.ts") });
cpSync(
  resolve(appDirectory, "../../packages/theme/fonts"),
  resolve(appDirectory, "out/fonts"),
  { recursive: true },
);
const config = nativeUpdateConfiguration();
writeFileSync(
  resolve(appDirectory, "out/native-release.json"),
  JSON.stringify({ schemaVersion: 1, platform: "android", ...config }, null, 2),
);
console.log(`Native web bundle ready: ${config.runtimeVersion}`);
