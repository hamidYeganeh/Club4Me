import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createConnection, Connection, Types } from "mongoose";
import { TrainingService } from "./training.service";
import {
  WorkoutPlanSchema,
  WorkoutAssignmentSchema,
  WorkoutSessionSchema,
} from "./training.models";
import type { SessionWrite, Plan } from "./training.contracts";

describe("training permissions, immutable snapshots and durable replay", () => {
  let mongo: MongoMemoryServer, db: Connection, service: TrainingService;
  const coachUser = new Types.ObjectId(),
    coach = new Types.ObjectId(),
    athlete = new Types.ObjectId(),
    stranger = new Types.ObjectId();
  const plan: Plan = {
    title: "برنامه اول",
    description: "",
    days: [
      {
        id: "day1",
        title: "روز اول",
        weekday: 0,
        exercises: [
          {
            exerciseId: "squat",
            sets: 2,
            reps: 10,
            weight: 20,
            restSeconds: 60,
            note: "",
          },
        ],
      },
    ],
  };
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    const plans = db.model("WorkoutPlan", WorkoutPlanSchema),
      assignments = db.model("WorkoutAssignment", WorkoutAssignmentSchema),
      sessions = db.model("WorkoutSession", WorkoutSessionSchema);
    await Promise.all([plans.init(), assignments.init(), sessions.init()]);
    service = new TrainingService(db, plans, assignments, sessions);
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    for (const collection of Object.values(db.collections))
      await collection.deleteMany({});
    await db
      .collection("coaches")
      .insertOne({ _id: coach, userId: coachUser, reviewStatus: "approved" });
    await db
      .collection("users")
      .insertOne({ _id: athlete, firstName: "ورزشکار", status: "active" });
    await db.collection("coach_package_purchases").insertOne({
      coachId: coach,
      athleteId: athlete,
      status: "active",
      paymentStatus: "paid",
      expiresAt: null,
    });
  });
  async function assigned() {
    const planId = String(new Types.ObjectId());
    await service.savePlan(String(coachUser), planId, {
      mutationId: randomUUID(),
      expectedVersion: 0,
      plan,
    });
    const write = {
      planId,
      version: 1,
      recipient: "athlete",
      recipientId: String(athlete),
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      mutationId: randomUUID(),
    };
    const assigned = await service.assign(String(coachUser), write);
    return { planId, assignment: assigned.items[0]!, write };
  }
  function log(assignmentId: string): SessionWrite {
    return {
      mutationId: randomUUID(),
      expectedRevision: 0,
      assignmentId,
      dayId: "day1",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: "active",
      sets: [
        { exerciseIndex: 0, setIndex: 0, reps: 10, weight: 20, done: true },
      ],
      note: "",
    };
  }
  it("versions plans without changing assignments; deduplicates retries", async () => {
    const { planId, assignment, write } = await assigned();
    const mutationId = randomUUID();
    const updated = {
      mutationId,
      expectedVersion: 1,
      plan: { ...plan, title: "نسخه دوم" },
    };
    expect(
      (await service.savePlan(String(coachUser), planId, updated)).version,
    ).toBe(2);
    expect(
      (await service.savePlan(String(coachUser), planId, updated)).version,
    ).toBe(2);
    await expect(
      service.savePlan(String(coachUser), planId, {
        ...updated,
        mutationId: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await service.assign(String(coachUser), write)).items[0]!.id).toBe(
      assignment.id,
    );
    expect(
      (await service.listAssignments(String(athlete))).items[0]!.snapshot.title,
    ).toBe(plan.title);
  });
  it("requires consent; binds sessions to athlete, assignment and revision", async () => {
    const { assignment } = await assigned();
    const body = log(assignment.id);
    const key = randomUUID();
    await expect(
      service.saveSession(String(athlete), key, body),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.consent(String(stranger), assignment.id, { accepted: true }),
    ).rejects.toMatchObject({ status: 404 });
    await service.consent(String(athlete), assignment.id, { accepted: true });
    expect(
      (await service.saveSession(String(athlete), key, body)).revision,
    ).toBe(1);
    expect(
      (await service.saveSession(String(athlete), key, body)).revision,
    ).toBe(1);
    await expect(
      service.saveSession(String(stranger), key, body),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.saveSession(String(athlete), key, {
        ...body,
        mutationId: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      service.saveSession(String(athlete), key, {
        ...body,
        expectedRevision: 1,
        mutationId: randomUUID(),
        dayId: "other",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("stops coach sharing immediately after withdrawal; preserves own existing log", async () => {
    const { assignment } = await assigned();
    await service.consent(String(athlete), assignment.id, { accepted: true });
    const body = log(assignment.id),
      key = randomUUID();
    await service.saveSession(String(athlete), key, body);
    expect(
      (await service.coachSessions(String(coachUser), assignment.id)).items,
    ).toHaveLength(1);
    await service.consent(String(athlete), assignment.id, { accepted: false });
    await expect(
      service.coachSessions(String(coachUser), assignment.id),
    ).rejects.toMatchObject({ status: 403 });
    const completed = {
      ...body,
      expectedRevision: 1,
      mutationId: randomUUID(),
      status: "completed",
      finishedAt: new Date().toISOString(),
    };
    expect(
      (await service.saveSession(String(athlete), key, completed)).revision,
    ).toBe(2);
    expect(
      (await service.saveSession(String(athlete), key, completed)).revision,
    ).toBe(2);
    await expect(
      service.saveSession(String(athlete), key, {
        ...completed,
        expectedRevision: 2,
        mutationId: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("rejects unrelated athletes, unpaid packages, and invalid set indices", async () => {
    const { assignment, write } = await assigned();
    await expect(
      service.assign(String(coachUser), {
        ...write,
        recipientId: String(stranger),
        mutationId: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 403 });
    await service.consent(String(athlete), assignment.id, { accepted: true });
    await expect(
      service.saveSession(String(athlete), randomUUID(), {
        ...log(assignment.id),
        sets: [
          { exerciseIndex: 0, setIndex: 9, reps: 10, weight: 20, done: true },
        ],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await db
      .collection("coach_package_purchases")
      .updateMany({}, { $set: { paymentStatus: "refunded" } });
    await expect(
      service.saveSession(String(athlete), randomUUID(), log(assignment.id)),
    ).rejects.toMatchObject({ status: 403 });
    expect((await service.clients(String(coachUser))).items).toHaveLength(0);
  });
  it("assigns classes only to active paid members", async () => {
    const { write } = await assigned();
    const classId = new Types.ObjectId();
    await db.collection("classes").insertOne({
      _id: classId,
      ownerCoachId: coach,
      status: "published",
      courseEndAt: new Date(Date.now() + 86400000),
    });
    await db.collection("class_enrollments").insertMany([
      { classId, athleteId: athlete, status: "active", paymentStatus: "paid" },
      {
        classId,
        athleteId: stranger,
        status: "active",
        paymentStatus: "pending",
      },
    ]);
    const result = await service.assign(String(coachUser), {
      ...write,
      recipient: "class",
      recipientId: String(classId),
      mutationId: randomUUID(),
    });
    expect(result.items).toHaveLength(1);
    expect(String(result.items[0]!.athleteId)).toBe(String(athlete));
  });
  it("links coach feedback to a completed session, prevents stale overwrite and respects withdrawn consent", async () => {
    const { assignment } = await assigned();
    await service.consent(String(athlete), assignment.id, { accepted: true });
    const clientId = randomUUID();
    const body = {
      ...log(assignment.id),
      status: "completed",
      finishedAt: new Date().toISOString(),
      effort: "hard",
      followUpRequested: true,
    };
    await service.saveSession(String(athlete), clientId, body);
    expect((await service.followUps(String(coachUser))).items[0]?.reason).toBe(
      "requested",
    );
    const result = await service.reviewSession(
      String(coachUser),
      assignment.id,
      clientId,
      { text: "جلسه بعد را با هم مرور می‌کنیم", expectedRevision: 0 },
    );
    expect(result.coachReview?.revision).toBe(1);
    expect(
      (await service.listSessions(String(athlete))).items[0]?.coachReview?.text,
    ).toBe("جلسه بعد را با هم مرور می‌کنیم");
    await expect(
      service.reviewSession(String(coachUser), assignment.id, clientId, {
        text: "نسخه قدیمی",
        expectedRevision: 0,
      }),
    ).rejects.toMatchObject({ status: 409 });
    await service.consent(String(athlete), assignment.id, { accepted: false });
    expect((await service.followUps(String(coachUser))).items).toEqual([]);
    await expect(
      service.reviewSession(String(coachUser), assignment.id, clientId, {
        text: "پاسخ تازه",
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
