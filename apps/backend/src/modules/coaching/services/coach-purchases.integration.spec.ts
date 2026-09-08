import { SessionsService } from "./sessions.service";
import { createConnection, Connection, Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { atomicOperation } from "../../../infrastructure/database/atomic-operation";
import {
  CoachPackagePurchase,
  CoachPackagePurchaseSchema,
} from "../schemas/coach-purchase.schema";
import {
  Coach,
  CoachSchema,
  CoachOffering,
  CoachOfferingSchema,
  TrainingSession,
  TrainingSessionSchema,
  SessionBooking,
  SessionBookingSchema,
} from "../schemas/coaching.schemas";
import { CoachPurchasesService } from "./coach-purchases.service";
import { BookingsService } from "./bookings.service";
import { CoachPackagePaymentReference } from "../../commerce/coach-package-payment-reference";

describe("coach package purchases and credits", () => {
  jest.setTimeout(60000);
  let db: Connection, mongo: MongoMemoryReplSet;
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    db = await createConnection(mongo.getUri()).asPromise();
    db.model(CoachPackagePurchase.name, CoachPackagePurchaseSchema);
    db.model(CoachOffering.name, CoachOfferingSchema);
    db.model(Coach.name, CoachSchema);
    db.model(TrainingSession.name, TrainingSessionSchema);
    db.model(SessionBooking.name, SessionBookingSchema);
    await Promise.all(Object.values(db.models).map((m) => m.init()));
  });
  afterEach(async () => {
    await Promise.all(
      Object.values(db.collections).map((c) => c.deleteMany({})),
    );
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  async function fixture(
    pricingType: "package" | "per_month" = "package",
    sessionCount: number | undefined = 1,
  ) {
    const athleteId = String(new Types.ObjectId()),
      coachId = new Types.ObjectId(),
      offeringId = new Types.ObjectId();
    const coach = {
      _id: coachId,
      reviewStatus: "approved",
      visibility: "public",
    };
    await db.model(Coach.name).collection.insertOne(coach);
    await db.model(CoachOffering.name).collection.insertOne({
      _id: offeringId,
      coachId,
      title: "بسته آزمون",
      status: "published",
      pricingType,
      sessionCount,
      price: { amount: 100000, currency: "IRR" },
      cancellationPolicy: { tiers: [{ hoursBefore: 0, refundPercent: 100 }] },
    });
    const coaches = {
      requireCoach: async () => coach,
      requireOwnedCoach: async () => coach,
    };
    const service = new CoachPurchasesService(
      db.model<CoachPackagePurchase>(CoachPackagePurchase.name),
      db.model<CoachOffering>(CoachOffering.name),
      coaches as never,
    );
    const bookings = new BookingsService(
      db.model(SessionBooking.name) as never,
      db.model(TrainingSession.name) as never,
      db.model(CoachOffering.name) as never,
      db.model<CoachPackagePurchase>(CoachPackagePurchase.name),
      coaches as never,
      {
        notifyBookingConfirmed: jest.fn(),
        notifyBookingCancelled: jest.fn(),
        notifyBookingRescheduled: jest.fn(),
      } as never,
      { refundCoaching: jest.fn() } as never,
    );
    const order = await service.create(
      athleteId,
      String(offeringId),
      "purchase-test-key",
    );
    const adapter = new CoachPackagePaymentReference(db);
    const activate = () =>
      atomicOperation(db, () =>
        adapter.finalize(new Types.ObjectId(String(order.id)), true),
      );
    async function session(days = 1) {
      const item = await db.model(TrainingSession.name).create({
        ownerCoachId: coachId,
        offeringId,
        sportId: new Types.ObjectId(),
        title: "سانس آزمون",
        startAt: new Date(Date.now() + days * 86400000),
        endAt: new Date(Date.now() + days * 86400000 + 3600000),
        capacity: 2,
        bookedCount: 0,
        status: "open_for_booking",
        deliveryMode: "online",
      });
      return String(item._id);
    }
    return {
      service,
      bookings,
      order,
      adapter,
      activate,
      session,
      athleteId,
      offeringId,
      coaches,
    };
  }
  it("uses the shared configurable payment deadline", async () => {
    const previous = process.env.PAYMENT_HOLD_MINUTES;
    process.env.PAYMENT_HOLD_MINUTES = "7";
    try {
      const { order } = await fixture();
      expect(
        new Date(String(order.paymentExpiresAt)).getTime() -
          new Date(String(order.purchasedAt)).getTime(),
      ).toBe(7 * 60000);
    } finally {
      if (previous === undefined) delete process.env.PAYMENT_HOLD_MINUTES;
      else process.env.PAYMENT_HOLD_MINUTES = previous;
    }
  });

  it("snapshots server price, replays purchase keys and protects payer ownership", async () => {
    const f = await fixture();
    expect(
      (
        await f.service.create(
          f.athleteId,
          String(f.offeringId),
          "purchase-test-key",
        )
      ).id,
    ).toBe(f.order.id);
    expect((f.order.priceSnapshot as { amount: number }).amount).toBe(100000);
    await expect(
      f.adapter.payable(String(new Types.ObjectId()), String(f.order.id)),
    ).rejects.toMatchObject({ code: "REFERENCE_NOT_PAYABLE" });
    await expect(
      f.service.create(
        f.athleteId,
        String(new Types.ObjectId()),
        "purchase-test-key",
      ),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("rejects unpaid credits and rolls session capacity back", async () => {
    const f = await fixture(),
      id = await f.session();
    await expect(f.bookings.book(f.athleteId, id)).rejects.toMatchObject({
      code: "PACKAGE_CREDIT_REQUIRED",
    });
    expect(
      (await db.model(TrainingSession.name).findById(id)).bookedCount,
    ).toBe(0);
    expect(await db.model(SessionBooking.name).countDocuments()).toBe(0);
  });
  it("consumes the last credit once under concurrent bookings, with no extra cash charge", async () => {
    const f = await fixture();
    await f.activate();
    const ids = await Promise.all([f.session(), f.session()]);
    const outcomes = await Promise.allSettled(
      ids.map((id) => f.bookings.book(f.athleteId, id)),
    );
    expect(outcomes.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    const booked = await db.model(SessionBooking.name).findOne();
    expect(booked.priceSnapshot.amount).toBe(0);
    expect(booked.status).toBe("confirmed");
    expect(
      (await db.model(CoachPackagePurchase.name).findById(f.order.id))
        .remainingSessions,
    ).toBe(0);
    expect(
      (await db.model(TrainingSession.name).find()).reduce(
        (n, s) => n + s.bookedCount,
        0,
      ),
    ).toBe(1);
    await f.bookings.cancelByAthlete(f.athleteId, String(booked._id));
    expect(
      (await db.model(CoachPackagePurchase.name).findById(f.order.id))
        .remainingSessions,
    ).toBe(1);
    await f.bookings.cancelByAthlete(f.athleteId, String(booked._id));
    expect(
      (await db.model(CoachPackagePurchase.name).findById(f.order.id))
        .remainingSessions,
    ).toBe(1);
  });
  it("activates monthly terms once and rejects sessions outside the 30-day window", async () => {
    const f = await fixture("per_month");
    await f.activate();
    const first = await db
      .model(CoachPackagePurchase.name)
      .findById(f.order.id);
    await f.activate();
    const next = await db.model(CoachPackagePurchase.name).findById(f.order.id);
    expect(next.expiresAt.getTime()).toBe(first.expiresAt.getTime());
    expect(next.expiresAt.getTime() - next.activatedAt.getTime()).toBe(
      30 * 86400000,
    );
    await expect(
      f.bookings.book(f.athleteId, await f.session(31)),
    ).rejects.toMatchObject({ code: "PACKAGE_CREDIT_REQUIRED" });
    await expect(
      f.bookings.book(f.athleteId, await f.session(1)),
    ).resolves.toMatchObject({ paymentStatus: "not_required" });
  });
  it("moves a confirmed booking atomically without charging another package credit", async () => {
    const f = await fixture("package", 2);
    await f.activate();
    const [previousId, targetId] = await Promise.all([
      f.session(1),
      f.session(2),
    ]);
    await f.bookings.book(f.athleteId, previousId);
    const booked = await db.model(SessionBooking.name).findOne().orFail();

    const moved = await f.bookings.reschedule(
      f.athleteId,
      String(booked._id),
      targetId,
      "coach-reschedule-test-key",
    );
    const replay = await f.bookings.reschedule(
      f.athleteId,
      String(booked._id),
      targetId,
      "coach-reschedule-test-key",
    );
    const [previous, target, purchase, stored] = await Promise.all([
      db.model(TrainingSession.name).findById(previousId),
      db.model(TrainingSession.name).findById(targetId),
      db.model(CoachPackagePurchase.name).findById(f.order.id),
      db.model(SessionBooking.name).findById(booked._id),
    ]);

    expect((moved as Record<string, unknown>).sessionId).toBe(targetId);
    expect((replay as Record<string, unknown>).sessionId).toBe(targetId);
    expect(previous.bookedCount).toBe(0);
    expect(target.bookedCount).toBe(1);
    expect(purchase.remainingSessions).toBe(1);
    expect(stored.rescheduleHistory).toHaveLength(1);
  });
  it("enforces the coach reschedule cutoff and keeps both capacities unchanged", async () => {
    const f = await fixture("package", 2);
    await f.activate();
    const [previousId, targetId] = await Promise.all([
      f.session(1),
      f.session(2),
    ]);
    await f.bookings.book(f.athleteId, previousId);
    const booked = await db.model(SessionBooking.name).findOne().orFail();
    await db.model(SessionBooking.name).updateOne(
      { _id: booked._id },
      {
        $set: { "cancellationPolicySnapshot.rescheduleCutoffMinutes": 2880 },
      },
    );

    await expect(
      f.bookings.reschedule(
        f.athleteId,
        String(booked._id),
        targetId,
        "coach-reschedule-cutoff-key",
      ),
    ).rejects.toMatchObject({ code: "RESCHEDULE_CUTOFF_REACHED" });
    expect(
      (await db.model(TrainingSession.name).findById(previousId)).bookedCount,
    ).toBe(1);
    expect(
      (await db.model(TrainingSession.name).findById(targetId)).bookedCount,
    ).toBe(0);
  });
  it("does not activate failed or expired purchases", async () => {
    const f = await fixture();
    await atomicOperation(db, () =>
      f.adapter.finalize(new Types.ObjectId(String(f.order.id)), false),
    );
    await expect(f.activate()).rejects.toMatchObject({
      code: "REFERENCE_STATUS_CHANGED",
    });
    const second = await f.service.create(
      f.athleteId,
      String(f.offeringId),
      "another-purchase-key",
    );
    await db
      .model(CoachPackagePurchase.name)
      .updateOne(
        { _id: second.id },
        { $set: { paymentExpiresAt: new Date(0) } },
      );
    await expect(
      atomicOperation(db, () =>
        f.adapter.finalize(new Types.ObjectId(String(second.id)), true),
      ),
    ).rejects.toMatchObject({ code: "REFERENCE_STATUS_CHANGED" });
    expect(
      await f.adapter.expire(new Types.ObjectId(String(second.id)), new Date()),
    ).toBe(true);
    expect(
      await db
        .model(CoachPackagePurchase.name)
        .countDocuments({ status: "active" }),
    ).toBe(0);
  });
  it("returns package credit when the coach cancels the whole session", async () => {
    const f = await fixture();
    await f.activate();
    const id = await f.session();
    await f.bookings.book(f.athleteId, id);
    const sessions = new SessionsService(
      db.model(TrainingSession.name) as never,
      db.model(CoachOffering.name) as never,
      db.model(SessionBooking.name) as never,
      {} as never,
      {} as never,
      {} as never,
      f.coaches as never,
      {} as never,
      { notifyBookingCancelled: jest.fn() } as never,
    );
    await sessions.cancel(f.athleteId, id, "تعطیلی");
    expect(
      (await db.model(CoachPackagePurchase.name).findById(f.order.id))
        .remainingSessions,
    ).toBe(1);
    await expect(
      sessions.cancel(f.athleteId, id, "تعطیلی"),
    ).rejects.toMatchObject({ code: "SESSION_NOT_CANCELLABLE" });
    expect(
      (await db.model(CoachPackagePurchase.name).findById(f.order.id))
        .remainingSessions,
    ).toBe(1);
  });
  it("replays simultaneous purchase retries without duplicating the order", async () => {
    const f = await fixture();
    const orders = await Promise.all(
      [1, 2].map(() =>
        f.service.create(
          f.athleteId,
          String(f.offeringId),
          "concurrent-order-key",
        ),
      ),
    );
    expect(orders).toHaveLength(2);
    expect(orders[0]?.id).toBeTruthy();
    expect(orders[0]?.id).toBe(orders[1]?.id);
  });
});
