import mongoose, { type Connection } from "mongoose";
import { MongoMemoryReplSet } from "../../../test/mongo-memory";
import { HabitsService } from "./habits";
import { randomUUID } from "node:crypto";

describe("private habit tracking", () => {
  let mongo: MongoMemoryReplSet, db: Connection, service: HabitsService;
  const owner = new mongoose.Types.ObjectId().toHexString(),
    other = new mongoose.Types.ObjectId().toHexString();
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    db = await mongoose.createConnection(mongo.getUri()).asPromise();
    service = new HabitsService(db);
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  it("enforces the active quota under concurrent creates and reactivation", async () => {
    const user = new mongoose.Types.ObjectId().toHexString();
    const input = { title: "عادت", unit: "بار", target: 1 };
    const archived = randomUUID();
    await service.save(user, archived, input);
    await service.archive(user, archived);
    for (let i = 0; i < 19; i++) await service.save(user, randomUUID(), input);
    const results = await Promise.allSettled([
      service.save(user, randomUUID(), input),
      service.save(user, archived, input),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect((await service.list(user)).items).toHaveLength(20);
  });
  it("retries overwrite the same day, captures the target, and isolates accounts", async () => {
    const id = randomUUID();
    await service.save(owner, id, {
      title: "پیاده‌روی",
      unit: "دقیقه",
      target: 20,
    });
    const { today } = await service.list(owner);
    await Promise.all([
      service.log(owner, id, { date: today, value: 20 }),
      service.log(owner, id, { date: today, value: 20 }),
    ]);
    expect((await service.list(owner)).items[0]!.logs).toEqual([
      { date: today, value: 20, target: 20 },
    ]);
    await service.save(owner, id, {
      title: "پیاده‌روی",
      unit: "دقیقه",
      target: 30,
    });
    expect((await service.list(owner)).items[0]!.logs[0]!.target).toBe(20);
    expect((await service.list(other)).items).toEqual([]);
    await expect(
      service.log(other, id, { date: today, value: 1 }),
    ).rejects.toMatchObject({ code: "HABIT_NOT_FOUND" });
    await service.archive(other, id);
    expect((await service.list(owner)).items).toHaveLength(1);
    await expect(
      service.log(owner, id, { date: "2099-01-01", value: 1 }),
    ).rejects.toMatchObject({ code: "INVALID_HABIT_DATE" });
    await service.archive(owner, id);
    expect((await service.list(owner)).items).toEqual([]);
  });
});
