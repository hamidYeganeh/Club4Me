import { readFileSync } from "node:fs";

const config = JSON.parse(
  readFileSync(
    new URL(
      "../android/app/src/main/assets/capacitor.config.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
if (
  config.server?.url !== "https://app.gym4me.ir" ||
  config.server?.cleartext !== false
) {
  throw new Error("Hosted Android must load https://app.gym4me.ir over HTTPS.");
}
if (config.plugins?.UpdateConfiguration?.enabled !== false) {
  throw new Error(
    "Hosted Android must not activate downloaded offline bundles.",
  );
}
console.log(
  "Hosted Android verified: each cold launch loads the current app.gym4me.ir deployment.",
);
