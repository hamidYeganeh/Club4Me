export type UpdateConfiguration = {
  runtimeVersion: string;
  manifestUrl: string;
  publicKey: string;
};
export type UpdateManifest = {
  schemaVersion: 1;
  platform: "android";
  runtimeVersion: string;
  bundleId: string;
  url: string;
  checksum: string;
  signature: string;
};
export type UpdateDriver = {
  getCurrentBundle(): Promise<{ bundleId: string | null }>;
  getNextBundle(): Promise<{ bundleId: string | null }>;
  getBlockedBundles(): Promise<{ bundleIds: string[] }>;
  getDownloadedBundles(): Promise<{ bundleIds: string[] }>;
  downloadBundle(options: {
    bundleId: string;
    url: string;
    checksum: string;
    signature: string;
  }): Promise<void>;
  setNextBundle(options: { bundleId: string }): Promise<void>;
};

function bytes(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (value) => value.charCodeAt(0));
}

export async function verifyUpdateEnvelope(
  envelope: unknown,
  config: UpdateConfiguration,
): Promise<UpdateManifest> {
  const signed = envelope as { payload?: unknown; signature?: unknown };
  if (
    !signed ||
    typeof signed.payload !== "string" ||
    signed.payload.length > 32_768 ||
    typeof signed.signature !== "string"
  )
    throw new Error("Invalid update envelope");
  const keyBytes = bytes(config.publicKey.replace(/-----[^-]+-----|\s/g, ""));
  const key = await crypto.subtle.importKey(
    "spki",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  if (
    !(await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      bytes(signed.signature),
      new TextEncoder().encode(signed.payload),
    ))
  )
    throw new Error("Update manifest signature is invalid");
  const manifest = JSON.parse(signed.payload) as UpdateManifest;
  if (
    manifest.schemaVersion !== 1 ||
    manifest.platform !== "android" ||
    manifest.runtimeVersion !== config.runtimeVersion ||
    !/^web-[a-f0-9]{64}$/.test(manifest.bundleId) ||
    !/^[a-f0-9]{64}$/.test(manifest.checksum) ||
    manifest.bundleId !== `web-${manifest.checksum}` ||
    typeof manifest.signature !== "string" ||
    !manifest.signature
  )
    throw new Error("Update is incompatible with this native runtime");
  const manifestUrl = new URL(config.manifestUrl);
  const url = new URL(manifest.url);
  if (
    manifestUrl.protocol !== "https:" ||
    url.protocol !== "https:" ||
    url.origin !== manifestUrl.origin ||
    url.username ||
    url.password
  )
    throw new Error("Update URL is not trusted");
  return manifest;
}

export async function stageLiveUpdate(
  config: UpdateConfiguration,
  driver: UpdateDriver,
  fetcher: typeof fetch = fetch,
) {
  if (!config.publicKey || new URL(config.manifestUrl).protocol !== "https:")
    throw new Error("Live updates require HTTPS and a signing key");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let envelope: unknown;
  try {
    const response = await fetcher(config.manifestUrl, {
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
      redirect: "error",
    });
    if (response.status === 404 || response.status === 204) return "no-update";
    if (!response.ok)
      throw new Error(`Update manifest returned ${response.status}`);
    const body = await response.text();
    if (body.length > 65_536) throw new Error("Update manifest is too large");
    envelope = JSON.parse(body);
  } finally {
    clearTimeout(timeout);
  }
  const manifest = await verifyUpdateEnvelope(envelope, config);
  const [current, next, blocked, downloaded] = await Promise.all([
    driver.getCurrentBundle(),
    driver.getNextBundle(),
    driver.getBlockedBundles(),
    driver.getDownloadedBundles(),
  ]);
  if (blocked.bundleIds.includes(manifest.bundleId)) return "blocked";
  if (
    current.bundleId === manifest.bundleId ||
    next.bundleId === manifest.bundleId
  )
    return "current";
  if (!downloaded.bundleIds.includes(manifest.bundleId))
    await driver.downloadBundle(manifest);
  // Native verification finishes before staging. The running UI is never reloaded during an interaction.
  await driver.setNextBundle({ bundleId: manifest.bundleId });
  return "staged";
}
