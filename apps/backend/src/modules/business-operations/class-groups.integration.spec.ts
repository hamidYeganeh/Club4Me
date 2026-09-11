import { MongoMemoryServer } from "mongodb-memory-server";
import { createConnection, type Connection, Types } from "mongoose";
import { ClassGroups } from "./class-groups";

describe("private class groups", () => {
  let mongo: MongoMemoryServer, db: Connection, service: ClassGroups;
  const classId = new Types.ObjectId(),
    otherClass = new Types.ObjectId();
  const members = Array.from({ length: 10 }, () => new Types.ObjectId());
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    service = new ClassGroups(db);
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    for (const c of await db.db!.collections()) await c.deleteMany({});
    await db
      .collection("business_training_classes")
      .insertOne({
        _id: classId,
        status: "active",
        endDate: new Date(Date.now() + 86400000),
      });
    for (const member of members) {
      const studentId = new Types.ObjectId();
      await db
        .collection("users")
        .insertOne({ _id: member, firstName: "عضو", phone: "private" });
      await db
        .collection("club_students")
        .insertOne({ _id: studentId, userId: member });
      await db
        .collection("business_class_enrollments")
        .insertOne({
          studentId,
          classId,
          status: "active",
          paymentStatus: "paid",
        });
    }
  });
  it("requires paid enrollment and explicit opt-in; never exposes members through another class", async () => {
    const owner = String(members[0]),
      member = String(members[1]);
    const group = await service.create(owner, String(classId), {
      title: "دوستان",
      goal: 2,
      accepted: true,
    });
    const { token } = await service.invite(owner, group.id);
    await expect(
      service.join(member, String(classId), { token, accepted: false }),
    ).rejects.toBeDefined();
    await expect(
      service.join(member, String(otherClass), { token, accepted: true }),
    ).rejects.toMatchObject({ status: 403 });
    await db
      .collection("business_class_enrollments")
      .updateMany({}, { $set: { paymentStatus: "pending" } });
    await expect(service.list(owner, String(classId))).rejects.toMatchObject({
      status: 403,
    });
  });
  it("caps concurrent joins, deduplicates retries, rotates invitations and removes sharing on exit", async () => {
    const owner = String(members[0]);
    const group = await service.create(owner, String(classId), {
      title: "دوستان",
      goal: 2,
      accepted: true,
    });
    expect(
      (
        await service.create(owner, String(classId), {
          title: "تکرار",
          goal: 3,
          accepted: true,
        })
      ).id,
    ).toBe(group.id);
    const old = await service.invite(owner, group.id);
    const fresh = await service.invite(owner, group.id);
    await expect(
      service.join(String(members[1]), String(classId), {
        token: old.token,
        accepted: true,
      }),
    ).rejects.toMatchObject({ status: 409 });
    await Promise.allSettled(
      members
        .slice(1)
        .map((member) =>
          service.join(String(member), String(classId), {
            token: fresh.token,
            accepted: true,
          }),
        ),
    );
    const state = await service.list(owner, String(classId));
    expect(state.items[0]!.members).toHaveLength(8);
    expect(JSON.stringify(state)).not.toContain("private");
    await expect(
      service.invite(String(members[1]), group.id),
    ).rejects.toMatchObject({ status: 404 });
    await service.leave(owner, group.id);
    expect((await service.list(owner, String(classId))).items).toEqual([]);
    await expect(
      service.join(String(members[9]), String(classId), {
        token: fresh.token,
        accepted: true,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
