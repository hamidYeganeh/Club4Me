import { createHash, createPublicKey, sign } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { resolve } from "node:path";
import { appDirectory, nativeUpdateConfiguration } from "./native-runtime.mjs";

const current = nativeUpdateConfiguration();
const built = JSON.parse(
  readFileSync(resolve(appDirectory, "out/native-release.json"), "utf8"),
);
if (!built.enabled || built.runtimeVersion !== current.runtimeVersion)
  throw new Error(
    "Rebuild the native web bundle with the installed APK's runtime and signing configuration first",
  );
const privateKey = readFileSync(
  process.env.OTA_PRIVATE_KEY_PATH ?? resolve(appDirectory, ".ota/private.pem"),
  "utf8",
);
if (
  createPublicKey(privateKey)
    .export({ type: "spki", format: "pem" })
    .toString()
    .trim() !== built.publicKey.trim()
)
  throw new Error("Signing key does not match the native public key");
const output = resolve(appDirectory, "release-artifacts", built.runtimeVersion);
mkdirSync(output, { recursive: true });
const temporary = resolve(output, `bundle-${process.pid}.zip`);
if (existsSync(temporary)) throw new Error("Temporary bundle already exists");
execFileSync("zip", ["-qr", temporary, ".", "-x", "*.map", ".DS_Store"], {
  cwd: resolve(appDirectory, "out"),
});
const archive = readFileSync(temporary);
const checksum = createHash("sha256").update(archive).digest("hex");
const bundleId = `web-${checksum}`;
renameSync(temporary, resolve(output, `${bundleId}.zip`));
const payload = JSON.stringify({
  schemaVersion: 1,
  platform: "android",
  runtimeVersion: built.runtimeVersion,
  bundleId,
  checksum,
  url: `${built.baseUrl}/${built.runtimeVersion}/${bundleId}.zip`,
  signature: sign("RSA-SHA256", archive, privateKey).toString("base64"),
});
const envelope = JSON.stringify(
  {
    payload,
    signature: sign("RSA-SHA256", Buffer.from(payload), privateKey).toString(
      "base64",
    ),
  },
  null,
  2,
);
writeFileSync(resolve(output, `${bundleId}.json`), envelope);
writeFileSync(resolve(output, "latest.json"), envelope);
console.log(
  `Signed update prepared in ${output}. Upload the ZIP before publishing latest.json.`,
);
