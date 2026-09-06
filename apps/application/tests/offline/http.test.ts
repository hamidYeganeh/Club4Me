import { test } from "node:test";
import assert from "node:assert/strict";
import { AxiosError } from "axios";
import {
  configureTokenPersistence,
  tokenStore,
} from "../../../../packages/api/src/http/token-store";
import {
  configureApi,
  getHttpClient,
  http,
  sessionRequest,
} from "../../../../packages/api/src/http/client";

test("financial writes fail immediately offline and are never silently scheduled", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: false },
  });
  let sent = 0;
  configureApi({ baseURL: "https://api.example", getAccessToken: () => null });
  getHttpClient().defaults.adapter = async (config) => {
    sent++;
    return {
      data: { data: {} },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  try {
    await assert.rejects(http.post("/reservations", {}), /internet connection/);
    await assert.rejects(
      http.post("/payments/intents", {}),
      /internet connection/,
    );
    assert.equal(sent, 0);
  } finally {
    if (previous) Object.defineProperty(globalThis, "navigator", previous);
  }
});

test("a queued request cannot borrow the token of a replacement session", async () => {
  configureApi({
    baseURL: "https://api.example",
    getAccessToken: () => "some-token",
  });
  let sent = 0;
  getHttpClient().defaults.adapter = async (config) => {
    sent++;
    return { data: {}, status: 200, statusText: "OK", headers: {}, config };
  };
  await assert.rejects(
    sessionRequest("user:old-account", "PUT", "/saves/club/1"),
    /Session changed/,
  );
  assert.equal(sent, 0);
});

test("an old replay's late 401 cannot log out a replacement account", async () => {
  const values = new Map<string, string>();
  await configureTokenPersistence({
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  });
  tokenStore.setSession("old-account", "old-refresh");
  let unauthorized = 0;
  configureApi({
    baseURL: "https://api.example",
    getAccessToken: tokenStore.get,
    refreshEndpoint: false,
    onUnauthorized: () => {
      unauthorized++;
      tokenStore.clear();
    },
  });
  getHttpClient().defaults.adapter = async (config) => {
    tokenStore.setSession("new-account", "new-refresh");
    throw new AxiosError("Expired", "ERR_BAD_REQUEST", config, undefined, {
      data: {},
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
    });
  };
  await assert.rejects(
    sessionRequest(tokenStore.identity(), "PUT", "/saves/club/1"),
    /Session changed/,
  );
  assert.equal(unauthorized, 0);
  assert.equal(tokenStore.get(), "new-account");
  tokenStore.clear();
});
