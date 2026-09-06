import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { appDirectory } from "./native-runtime.mjs";

const directory = resolve(process.argv[2] ?? resolve(appDirectory, ".ota"));
mkdirSync(directory, { recursive: true, mode: 0o700 });
const keys = generateKeyPairSync("rsa", {
  modulusLength: 3072,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
// Never overwrite a release key: existing installed apps trust its public half.
writeFileSync(resolve(directory, "private.pem"), keys.privateKey, {
  flag: "wx",
  mode: 0o600,
});
writeFileSync(resolve(directory, "public.pem"), keys.publicKey, {
  flag: "wx",
  mode: 0o644,
});
console.log(
  `Release keys created in ${directory}. Keep private.pem in your signing secret storage.`,
);
