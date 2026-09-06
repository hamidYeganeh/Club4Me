import { test } from "node:test";
import assert from "node:assert/strict";
import {
  OfflineOutbox,
  type OfflineAction,
} from "../../../../packages/api/src/offline/outbox";
import { memoryStorage } from "./storage-fixture";

test("coalesces repeated intent, survives restart, and replays the final desired state", async () => {
  const storage = memoryStorage();
  const sent: unknown[] = [];
  let actions: OfflineAction[] = [];
  const handler = async (payload: unknown) => {
    sent.push(payload);
  };
  const first = new OfflineOutbox(
    storage,
    "alice",
    { save: handler },
    () => true,
    (next) => {
      actions = next;
    },
  );
  await first.enqueue("save", "club:1", { saved: true });
  await first.enqueue("save", "club:1", { saved: false });
  assert.equal(actions.length, 1);
  first.stop();
  const restarted = new OfflineOutbox(
    storage,
    "alice",
    { save: handler },
    () => true,
    () => {},
  );
  await restarted.flush();
  assert.deepEqual(sent, [{ saved: false }]);
  assert.deepEqual(await restarted.read(), []);
});

test("retains transient failures and exposes permanent rejections without silently losing them", async () => {
  const storage = memoryStorage();
  let status = 503;
  const box = new OfflineOutbox(
    storage,
    "alice",
    {
      save: async () => {
        throw { status };
      },
    },
    () => true,
    () => {},
  );
  await box.enqueue("save", "club:1", true);
  await box.flush();
  assert.equal((await box.read())[0]?.status, "pending");
  status = 404;
  await box.flush();
  assert.equal((await box.read())[0]?.status, "failed");
  await box.discardFailed();
  assert.deepEqual(await box.read(), []);
});

test("never replays another account's actions or unregistered operations", async () => {
  let current = true;
  let sends = 0;
  const box = new OfflineOutbox(
    memoryStorage(),
    "alice",
    {
      save: async () => {
        sends++;
      },
    },
    () => current,
    () => {},
  );
  await assert.rejects(box.enqueue("payment", "payment:1", {}));
  await box.enqueue("save", "club:1", true);
  current = false;
  await box.flush();
  assert.equal(sends, 0);
  await assert.rejects(box.enqueue("save", "club:2", true));
});

test("does not acknowledge an action when storage fails", async () => {
  const storage = memoryStorage();
  storage.set = async () => {
    throw new Error("quota exceeded");
  };
  let changed = false;
  const box = new OfflineOutbox(
    storage,
    "alice",
    { save: async () => {} },
    () => true,
    () => {
      changed = true;
    },
  );
  await assert.rejects(box.enqueue("save", "club:1", true));
  assert.equal(changed, false);
});

test("serializes enqueue during an in-flight replay without dropping the newer intent", async () => {
  const storage = memoryStorage();
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const box = new OfflineOutbox(
    storage,
    "alice",
    { save: () => wait },
    () => true,
    () => {},
  );
  await box.enqueue("save", "club:1", true);
  const flushing = box.flush();
  const newer = box.enqueue("save", "club:1", false);
  release();
  await Promise.all([flushing, newer]);
  assert.equal((await box.read())[0]?.payload, false);
});

test("logout clears the queue after an already-started disk write completes", async () => {
  const storage = memoryStorage();
  const originalSet = storage.set;
  let release!: () => void;
  let writing!: () => void;
  const started = new Promise<void>((resolve) => {
    writing = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  storage.set = async (key, value) => {
    writing();
    await pending;
    await originalSet(key, value);
  };
  const box = new OfflineOutbox(
    storage,
    "alice",
    { save: async () => {} },
    () => true,
    () => {},
  );
  const enqueue = box.enqueue("save", "club:1", true);
  const rejected = assert.rejects(enqueue, /Session changed/);
  await started;
  const clearing = box.clear();
  release();
  await Promise.all([rejected, clearing]);
  assert.equal(await storage.get("alice"), undefined);
});
