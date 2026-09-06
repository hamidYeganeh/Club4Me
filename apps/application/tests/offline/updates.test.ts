import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  stageLiveUpdate,
  verifyUpdateEnvelope,
  type UpdateDriver,
} from "../../lib/update-protocol";

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const config = {
  publicKey: keys.publicKey.export({ type: "spki", format: "pem" }).toString(),
  runtimeVersion: "android-1",
  manifestUrl: "https://app.example/updates/latest.json",
};
const checksum = "a".repeat(64);
const manifest = {
  schemaVersion: 1,
  platform: "android",
  runtimeVersion: "android-1",
  bundleId: `web-${checksum}`,
  checksum,
  signature: "native-zip-signature",
  url: "https://app.example/updates/bundle.zip",
};
function envelope(changes = {}) {
  const payload = JSON.stringify({ ...manifest, ...changes });
  return {
    payload,
    signature: sign(
      "RSA-SHA256",
      Buffer.from(payload),
      keys.privateKey,
    ).toString("base64"),
  };
}
function driver() {
  const calls: string[] = [];
  const api: UpdateDriver = {
    getCurrentBundle: async () => ({ bundleId: null }),
    getNextBundle: async () => ({ bundleId: null }),
    getBlockedBundles: async () => ({ bundleIds: [] }),
    getDownloadedBundles: async () => ({ bundleIds: [] }),
    downloadBundle: async (options) => {
      assert.equal(options.signature, manifest.signature);
      calls.push("download");
    },
    setNextBundle: async () => {
      calls.push("stage");
    },
  };
  return { api, calls };
}
const fetchManifest = async () => new Response(JSON.stringify(envelope()));

test("accepts a signed, compatible update and stages only after native download verification", async () => {
  const { api, calls } = driver();
  assert.equal(await stageLiveUpdate(config, api, fetchManifest), "staged");
  assert.deepEqual(calls, ["download", "stage"]);
});
test("rejects tampering, incompatible runtimes and untrusted download origins", async () => {
  const modified = envelope();
  modified.payload = modified.payload.replace("android-1", "android-2");
  await assert.rejects(verifyUpdateEnvelope(modified, config), /signature/);
  for (const changes of [
    { runtimeVersion: "android-2" },
    { platform: "ios" },
    { url: "http://app.example/update.zip" },
    { url: "https://evil.example/update.zip" },
    { bundleId: "../../escape" },
  ]) {
    await assert.rejects(verifyUpdateEnvelope(envelope(changes), config));
  }
});
test("does not stage a failed download or retry a rolled-back bundle", async () => {
  const { api, calls } = driver();
  api.downloadBundle = async () => {
    throw new Error("signature mismatch");
  };
  await assert.rejects(stageLiveUpdate(config, api, fetchManifest));
  assert.deepEqual(calls, []);
  api.getBlockedBundles = async () => ({ bundleIds: [manifest.bundleId] });
  assert.equal(await stageLiveUpdate(config, api, fetchManifest), "blocked");
});
test("an absent update leaves the installed bundle usable", async () => {
  const { api, calls } = driver();
  assert.equal(
    await stageLiveUpdate(
      config,
      api,
      async () => new Response(null, { status: 404 }),
    ),
    "no-update",
  );
  assert.deepEqual(calls, []);
});
