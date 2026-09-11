import { test } from "node:test";
import assert from "node:assert/strict";
import { TrainingStore } from "../../../../packages/api/src/offline/training-store";
import type {
  SessionRecord,
  SessionWrite,
} from "../../../../packages/api/src/domains/training";
import { memoryStorage } from "./storage-fixture";
const session = (): SessionRecord => ({
  clientId: crypto.randomUUID(),
  assignmentId: "66d400000000000000000001",
  dayId: "day",
  revision: 0,
  startedAt: new Date().toISOString(),
  finishedAt: null,
  status: "active",
  sets: [],
  note: "",
  snapshot: { title: "plan", description: "", days: [] },
});

test("rapid field edits and completion are serialized against the latest durable session", async () => {
  const original = session(),
    storage = memoryStorage();
  const store = new TrainingStore(storage, "alice", async (_, body) => ({
    ...original,
    ...body,
    revision: 1,
  }));
  await store.save(original);
  await Promise.all([
    store.update(original.clientId, (current) => ({
      ...current,
      note: "first",
    })),
    store.update(original.clientId, (current) => ({
      ...current,
      sets: [
        { exerciseIndex: 0, setIndex: 0, reps: 12, weight: 32.5, done: true },
      ],
    })),
    store.update(original.clientId, (current) => ({
      ...current,
      status: "completed",
      finishedAt: new Date().toISOString(),
    })),
  ]);
  const state = await store.read();
  assert.equal(state.workouts[0]?.session.note, "first");
  assert.equal(state.workouts[0]?.session.sets[0]?.weight, 32.5);
  assert.equal(state.workouts[0]?.session.status, "completed");
});

test("a permanently rejected workout does not block another and only conflicts are marked for replacement", async () => {
  const first = session(),
    second = session(),
    storage = memoryStorage();
  const store = new TrainingStore(storage, "alice", async (id, body) => {
    if (id === first.clientId)
      throw Object.assign(new Error("conflict"), { status: 409 });
    return { ...second, ...body, revision: 1 };
  });
  await store.save(first);
  await store.save(second);
  await assert.rejects(store.sync());
  const state = await store.read();
  assert.equal(state.workouts[0]?.conflicted, true);
  assert.equal(state.workouts[1]?.dirty, false);
  assert.equal(state.workouts[1]?.pending, undefined);
});
test("restart preserves pending mutation and retries the identical payload after a lost response", async () => {
  const storage = memoryStorage(),
    original = {
      ...session(),
      effort: "hard" as const,
      followUpRequested: true,
    };
  let first: SessionWrite | undefined;
  const store = new TrainingStore(storage, "alice", async (_, body) => {
    first = structuredClone(body);
    assert.equal(body.effort, "hard");
    assert.equal(body.followUpRequested, true);
    throw new Error("lost response");
  });
  await store.save(original, 999);
  await assert.rejects(store.sync());
  const restarted = new TrainingStore(storage, "alice", async (_, body) => {
    assert.deepEqual(body, first);
    return { ...original, revision: 1 };
  });
  assert.equal((await restarted.read()).workouts[0]?.restUntil, 999);
  const state = await restarted.sync();
  assert.equal(state.workouts[0]?.dirty, false);
  assert.equal(state.workouts[0]?.pending, undefined);
  assert.equal(state.workouts[0]?.session.revision, 1);
});
test("edits after a failed replay are sent after its acknowledgement without losing edits", async () => {
  const storage = memoryStorage(),
    original = session();
  let fail = true;
  const received: SessionWrite[] = [];
  const store = new TrainingStore(storage, "alice", async (_, body) => {
    received.push(structuredClone(body));
    if (fail) throw new Error("offline");
    return { ...original, ...body, revision: body.expectedRevision + 1 };
  });
  await store.save(original);
  await assert.rejects(store.sync());
  await store.save({ ...original, note: "new local edit" });
  fail = false;
  const state = await store.sync();
  assert.equal(received[0]?.mutationId, received[1]?.mutationId);
  assert.equal(received[2]?.expectedRevision, 1);
  assert.equal(state.workouts[0]?.session.note, "new local edit");
  assert.equal(state.workouts[0]?.session.revision, 2);
});
test("conflict and storage failure never report a draft as synced; accounts stay isolated", async () => {
  const storage = memoryStorage(),
    original = session();
  const store = new TrainingStore(storage, "alice", async () => {
    throw new Error("conflict");
  });
  await store.save(original);
  await assert.rejects(store.sync());
  assert.ok((await store.read()).workouts[0]?.pending);
  const bob = new TrainingStore(storage, "bob", async () => original);
  assert.deepEqual((await bob.read()).workouts, []);
  const broken = new TrainingStore(
    {
      ...storage,
      set: async () => {
        throw new Error("quota");
      },
    },
    "broken",
    async () => original,
  );
  await assert.rejects(broken.save(original), /quota/);
});
