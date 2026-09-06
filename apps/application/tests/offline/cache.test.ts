import { test } from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import {
  saveOfflineCache,
  restoreOfflineCache,
  OFFLINE_MAX_AGE,
} from "../../../../packages/api/src/offline/cache";
import { memoryStorage } from "./storage-fixture";

test("restores account and reservations across a fresh client without persisting financial or auth results", async () => {
  const storage = memoryStorage();
  const first = new QueryClient();
  first.setQueryData(["account", "me"], { id: "alice", hasPassword: true });
  first.setQueryData(["reservations", "mine"], {
    items: [{ id: "reservation-1" }],
  });
  first.setQueryData(["athlete", "coach-bookings"], { items: [] });
  first.setQueryData(["public", "clubs", "club-1"], { title: "Cached club" });
  first.setQueryData(["public", "clubs", "club-1", "capacity"], {
    remaining: 1,
  });
  first.setQueryData(["benefits", "wallet"], { balance: 500 });
  first.setQueryData(["account", "role-requests"], {
    items: ["private-admin-data"],
  });
  first.setQueryData(["discovery", "clubs", "club-1", "reservable-sessions"], {
    remaining: 1,
  });
  await saveOfflineCache(first, storage, "alice");
  const restarted = new QueryClient();
  await restoreOfflineCache(restarted, storage, "alice");
  assert.deepEqual(restarted.getQueryData(["account", "me"]), {
    id: "alice",
    hasPassword: true,
  });
  assert.deepEqual(restarted.getQueryData(["reservations", "mine"]), {
    items: [{ id: "reservation-1" }],
  });
  assert.deepEqual(restarted.getQueryData(["public", "clubs", "club-1"]), {
    title: "Cached club",
  });
  assert.equal(restarted.getQueryCache().getAll().length, 4);
  const differentUser = new QueryClient();
  await restoreOfflineCache(differentUser, storage, "bob");
  assert.equal(differentUser.getQueryCache().getAll().length, 0);
  first.clear();
  restarted.clear();
  differentUser.clear();
});

test("expired and incompatible caches cannot restore a session", async () => {
  const storage = memoryStorage();
  const client = new QueryClient();
  client.setQueryData(["account", "me"], { id: "alice" });
  await saveOfflineCache(client, storage, "alice");
  client.clear();
  await restoreOfflineCache(
    client,
    storage,
    "alice",
    Date.now() + OFFLINE_MAX_AGE + 1,
  );
  assert.equal(client.getQueryCache().getAll().length, 0);
  await storage.set("alice", {
    version: 999,
    savedAt: Date.now(),
    state: { queries: [] },
  });
  await restoreOfflineCache(client, storage, "alice");
  assert.equal(await storage.get("alice"), undefined);
  client.clear();
});
