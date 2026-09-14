import { test } from "node:test";
import assert from "node:assert/strict";
import {
  configureApi,
  getHttpClient,
} from "../../../../packages/api/src/http/client";
import { tokenStore } from "../../../../packages/api/src/http/token-store";
import {
  configureTelemetryContext,
  flushTelemetryQueue,
  setTelemetryConsent,
  trackAppOpened,
  resetTelemetryIdentity,
} from "../../../../packages/api/src/tracking/tracking";
const values = new Map<string, string>();
const storage = {
  getItem: (k: string) => values.get(k) ?? null,
  setItem: (k: string, v: string) => {
    values.set(k, v);
  },
  removeItem: (k: string) => {
    values.delete(k);
  },
};
const events = new EventTarget();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: storage,
    sessionStorage: storage,
    addEventListener: events.addEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  },
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { onLine: true },
});
configureApi({
  baseURL: "https://analytics.test",
  getAccessToken: tokenStore.get,
});
const jwt = (sub: string) =>
  `a.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.signature`;

test("new events added during an in-flight flush survive acknowledgement", async () => {
  resetTelemetryIdentity();
  setTelemetryConsent(true);
  let entered!: () => void, release!: () => void;
  const started = new Promise<void>((r) => {
      entered = r;
    }),
    hold = new Promise<void>((r) => {
      release = r;
    });
  const sent: string[] = [];
  getHttpClient().defaults.adapter = async (config) => {
    const body = JSON.parse(config.data);
    sent.push(body.eventId);
    if (sent.length === 1) {
      entered();
      await hold;
    }
    return {
      data: { data: { accepted: true } },
      status: 202,
      statusText: "Accepted",
      headers: {},
      config,
    };
  };
  configureTelemetryContext({ platform: "web", appVersion: "test" });
  trackAppOpened({ screen: "discovery" });
  await started;
  trackAppOpened({ screen: "profile" });
  release();
  await flushTelemetryQueue();
  assert.equal(sent.length, 2);
  assert.notEqual(sent[0], sent[1]);
  assert.deepEqual(
    JSON.parse(values.get("gym4me.telemetry.queue.v2") ?? "[]"),
    [],
  );
});
test("identity changes and consent withdrawal clear unsent events", async () => {
  (navigator as unknown as { onLine: boolean }).onLine = false;
  tokenStore.setSession(jwt("first"), "refresh");
  setTelemetryConsent(true);
  trackAppOpened({ screen: "athlete" });
  await flushTelemetryQueue();
  assert.equal(
    JSON.parse(values.get("gym4me.telemetry.queue.v2") ?? "[]").length,
    1,
  );
  tokenStore.setSession(jwt("second"), "refresh");
  assert.equal(values.has("gym4me.telemetry.queue.v2"), false);
  trackAppOpened({ screen: "profile" });
  setTelemetryConsent(false);
  await flushTelemetryQueue();
  assert.equal(values.has("gym4me.telemetry.queue.v2"), false);
  tokenStore.clear();
  (navigator as unknown as { onLine: boolean }).onLine = true;
});
test("opaque tokens never appear in the analytics queue", async () => {
  tokenStore.setSession("secret-opaque-token", "refresh");
  setTelemetryConsent(true);
  trackAppOpened({ screen: "other" });
  await flushTelemetryQueue();
  assert.ok(
    !JSON.stringify(
      [...values.entries()].filter(([k]) => k.includes("telemetry")),
    ).includes("secret-opaque-token"),
  );
  tokenStore.clear();
});
