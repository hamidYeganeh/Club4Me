import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const appDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function nativeUpdateConfiguration() {
  const publicKeyPath =
    process.env.OTA_PUBLIC_KEY_PATH ?? resolve(appDirectory, ".ota/public.pem");
  const publicKey = existsSync(publicKeyPath)
    ? readFileSync(publicKeyPath, "utf8")
    : "";
  const baseUrl = process.env.OTA_BASE_URL ?? "https://app.gym4me.ir/updates";
  const url = new URL(baseUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "OTA_BASE_URL must be an HTTPS URL without credentials, query or fragment",
    );
  const files = [];
  function collect(directory) {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (
        [
          "build",
          ".gradle",
          ".idea",
          "public",
          "google-services.json",
          "local.properties",
          "capacitor.config.json",
          "capacitor.plugins.json",
          "config.xml",
        ].includes(entry.name)
      )
        continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) collect(path);
      else if (/\.(java|kt|xml|gradle|properties)$/.test(entry.name))
        files.push(path);
    }
  }
  collect(resolve(appDirectory, "android/app/src/main"));
  for (const name of [
    "android/app/build.gradle",
    "android/variables.gradle",
    "android/build.gradle",
    "capacitor.config.ts",
    "scripts/native-runtime.mjs",
  ])
    files.push(resolve(appDirectory, name));
  const dependencies = JSON.parse(
    readFileSync(resolve(appDirectory, "package.json"), "utf8"),
  ).dependencies;
  const hash = createHash("sha256")
    .update(publicKey)
    .update(baseUrl)
    .update(
      JSON.stringify({
        demo: process.env.CAPACITOR_DEMO === "1",
        cleartext: process.env.CAPACITOR_ALLOW_CLEARTEXT === "1",
        devServer: process.env.CAPACITOR_DEV_URL ?? "",
        hostedServer: process.env.CAPACITOR_SERVER_URL ?? "",
      }),
    );
  for (const name of Object.keys(dependencies).sort()) {
    const path = [
      resolve(appDirectory, "node_modules", name, "package.json"),
      resolve(appDirectory, "../../node_modules", name, "package.json"),
    ].find(existsSync);
    if (!path) continue;
    const dependency = JSON.parse(readFileSync(path, "utf8"));
    if (
      dependency.capacitor ||
      dependency.cordova ||
      name.startsWith("@capacitor/")
    )
      hash.update(`${name}:${dependency.version}`);
  }
  for (const path of [...new Set(files)].sort())
    if (existsSync(path))
      hash.update(relative(appDirectory, path)).update(readFileSync(path));
  const runtimeVersion = `android-${hash.digest("hex")}`;
  return {
    enabled: Boolean(publicKey),
    publicKey,
    runtimeVersion,
    baseUrl: baseUrl.replace(/\/$/, ""),
    manifestUrl: `${baseUrl.replace(/\/$/, "")}/${runtimeVersion}/latest.json`,
  };
}
