import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appDirectory, nativeUpdateConfiguration } from "./native-runtime.mjs";

const current = nativeUpdateConfiguration();
const web = JSON.parse(
  readFileSync(resolve(appDirectory, "out/native-release.json"), "utf8"),
);
const android = JSON.parse(
  readFileSync(
    resolve(appDirectory, "android/app/src/main/assets/capacitor.config.json"),
    "utf8",
  ),
);
if (android.server?.url)
  throw new Error("Android must load its local bundle for offline releases");
if (
  web.runtimeVersion !== current.runtimeVersion ||
  android.plugins?.UpdateConfiguration?.runtimeVersion !==
    current.runtimeVersion
)
  throw new Error(
    "Native configuration and web bundle differ. Rebuild and sync with the same environment.",
  );
console.log(`Native runtime verified: ${current.runtimeVersion}`);
