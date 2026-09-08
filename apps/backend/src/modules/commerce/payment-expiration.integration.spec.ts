import {
  CoachPackagePurchase,
  CoachPackagePurchaseSchema,
} from "../coaching/schemas/coach-purchase.schema";
import {
  SessionBooking,
  SessionBookingSchema,
  ClassEnrollment,
  ClassEnrollmentSchema,
  TrainingSession,
  TrainingSessionSchema,
  TrainingClass,
  TrainingClassSchema,
} from "../coaching/schemas/coaching.schemas";
import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { CommerceService } from "./commerce.service";
import { MockPaymentProvider } from "./mock-payment.provider";
import {
  PaymentIntentSchema,
  PaymentCallbackEventSchema,
  LedgerEntrySchema,
  SettlementAccountSchema,
} from "./schemas/commerce.schema";
import { ReservationSchema } from "../reservations/schemas/reservation.schema";
import { ReservableSessionSchema } from "../reservations/schemas/reservable-session.schema";

describe("payment hold expiration", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryReplSet;
  let db: Connection;
  let service: CommerceService;
  let intents: ReturnType<typeof models>["intents"];
  let reservations: ReturnType<typeof models>["reservations"];
  let sessions: ReturnType<typeof models>["sessions"];
  function models(connection: Connection) {
    return {
      intents: connection.model("PaymentIntent", PaymentIntentSchema),
      reservations: connection.model("Reservation", ReservationSchema),
      sessions: connection.model("ReservableSession", ReservableSessionSchema),
    };
  }
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    db = await createConnection(mongo.getUri()).asPromise();
    ({ intents, reservations, sessions } = models(db));
    db.model(SessionBooking.name, SessionBookingSchema);
    db.model(ClassEnrollment.name, ClassEnrollmentSchema);
    db.model(CoachPackagePurchase.name, CoachPackagePurchaseSchema);
    db.model(TrainingSession.name, TrainingSessionSchema);
    db.model(TrainingClass.name, TrainingClassSchema);
    const callbacks = db.model(
        "PaymentCallbackEvent",
        PaymentCallbackEventSchema,
      ),
      ledger = db.model("LedgerEntry", LedgerEntrySchema),
      accounts = db.model("SettlementAccount", SettlementAccountSchema);
    service = new CommerceService(
      intents as never,
      callbacks as never,
      ledger as never,
      reservations as never,
      sessions as never,
      accounts as never,
      new MockPaymentProvider({
        env: { NODE_ENV: "test", MOCK_PAYMENT_CALLBACK_SECRET: "test-secret" },
      } as never),
      {
        notifyPaymentFailed: jest.fn(),
        notifyBookingConfirmed: jest.fn(),
      } as never,
      { finalizePayment: jest.fn(), settleReferral: jest.fn() } as never,
      { finalizeReservation: jest.fn(), finalizePurchase: jest.fn() } as never,
      {
        expirePaymentHolds: jest
          .fn()
          .mockResolvedValue({ expired: 0, errors: [] }),
      } as never,
    );
    await Promise.all(Object.values(db.models).map((model) => model.init()));
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    if (db)
      await Promise.all(
        Object.values(db.collections).map((collection) =>
          collection.deleteMany({}),
        ),
      );
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  async function fixture(withIntent = false) {
    const userId = new Types.ObjectId(),
      clubId = new Types.ObjectId();
    const session = await sessions.create({
      clubId,
      title: "زمین تست",
      startsAt: new Date(Date.now() + 3600000),
      endsAt: new Date(Date.now() + 7200000),
      capacity: 5,
      reservedCount: 3,
      basePrice: 100,
      cancellationPolicy: { title: "لغو", tiers: [] },
    });
    const reservation = await reservations.create({
      clubId,
      userId,
      sessionId: session._id,
      sessionType: "court",
      sessionTitle: session.title,
      sessionStartsAt: session.startsAt,
      sessionEndsAt: session.endsAt,
      participantCount: 2,
      totalPrice: 200,
      paymentStatus: "pending",
      status: "reserved",
      paymentExpiresAt: new Date(Date.now() - 1000),
      cancellationPolicy: { title: "لغو", tiers: [] },
    });
    const intent = withIntent
      ? await intents.create({
          userId,
          clubId,
          referenceType: "reservation",
          referenceId: reservation._id,
          amount: 200,
          grossAmount: 200,
          platformFee: 20,
          authority: "expired-authority",
          idempotencyKey: "expired-key",
          returnUrl: "https://example.test/return",
          expiresAt: reservation.paymentExpiresAt,
        })
      : null;
    return { session, reservation, intent };
  }
  it("releases an abandoned hold once even when cleanup workers overlap", async () => {
    const { session, reservation } = await fixture();
    await Promise.all([
      service.expirePendingPayments(),
      service.expirePendingPayments(),
    ]);
    await service.expirePendingPayments();
    expect(await reservations.findById(reservation._id).lean()).toMatchObject({
      status: "cancelled",
      paymentStatus: "failed",
      cancellationReason: "payment_expired",
    });
    const inventory = await sessions.findById(session._id).lean();
    expect(inventory?.reservedCount).toBe(1);
    expect(inventory?.releasedReservationIds).toHaveLength(1);
  });
  it("resumes cleanup after inventory was released but the completion marker failed", async () => {
    const { session } = await fixture();
    jest
      .spyOn(reservations, "updateOne")
      .mockImplementationOnce(
        () => Promise.reject(new Error("temporary write failure")) as never,
      );
    expect((await service.expirePendingPayments()).errors).toHaveLength(1);
    expect((await service.expirePendingPayments()).errors).toHaveLength(0);
    expect((await sessions.findById(session._id))?.reservedCount).toBe(1);
  });
  it("rejects late successful payment and releases its hold through the shared failure workflow", async () => {
    const { session, reservation, intent } = await fixture(true);
    await expect(
      service.simulate(String(reservation.userId), String(intent!._id), "paid"),
    ).rejects.toMatchObject({ code: "PAYMENT_EXPIRED" });
    expect((await intents.findById(intent!._id))?.status).toBe("failed");
    expect((await sessions.findById(session._id))?.reservedCount).toBe(1);
    expect(await db.model("LedgerEntry").countDocuments()).toBe(0);
  });
  it("does not expire a paid order", async () => {
    const { session, reservation, intent } = await fixture(true);
    await intents.updateOne({ _id: intent!._id }, { $set: { status: "paid" } });
    await reservations.updateOne(
      { _id: reservation._id },
      { $set: { paymentStatus: "paid" } },
    );
    await service.expirePendingPayments();
    expect((await sessions.findById(session._id))?.reservedCount).toBe(3);
  });
});
