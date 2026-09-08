import {
  CoachOffering,
  CoachOfferingSchema,
} from "../coaching/schemas/coaching.schemas";
import {
  CoachPackagePurchase,
  CoachPackagePurchaseSchema,
} from "../coaching/schemas/coach-purchase.schema";
import { ReservationsService } from "../reservations/reservations.service";
import { CreateReservationDto } from "../reservations/dto/reservation.dto";
import {
  afterCommit,
  atomicOperation,
} from "../../infrastructure/database/atomic-operation";
import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { CommerceService } from "./commerce.service";
import { MockPaymentProvider } from "./mock-payment.provider";
import {
  PaymentIntent,
  PaymentIntentSchema,
  PaymentCallbackEvent,
  PaymentCallbackEventSchema,
  LedgerEntry,
  LedgerEntrySchema,
  SettlementAccount,
  SettlementAccountSchema,
} from "./schemas/commerce.schema";
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
import {
  Reservation,
  ReservationSchema,
} from "../reservations/schemas/reservation.schema";
import {
  ReservableSession,
  ReservableSessionSchema,
} from "../reservations/schemas/reservable-session.schema";
import { CoachingPaymentReference } from "./coaching-payment-reference";
import { Coach, CoachSchema } from "../coaching/schemas/coaching.schemas";
import { PayoutRequest, PayoutRequestSchema } from "./schemas/commerce.schema";
import { PayoutsService } from "./payouts.service";

describe("shared coach commerce", () => {
  jest.setTimeout(60_000);
  let db: Connection, mongo: MongoMemoryReplSet, service: CommerceService;
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    db = await createConnection(mongo.getUri()).asPromise();
    const intents = db.model(PaymentIntent.name, PaymentIntentSchema);
    const callbacks = db.model(
      PaymentCallbackEvent.name,
      PaymentCallbackEventSchema,
    );
    const ledger = db.model(LedgerEntry.name, LedgerEntrySchema);
    const accounts = db.model(SettlementAccount.name, SettlementAccountSchema);
    const reservations = db.model(Reservation.name, ReservationSchema);
    const slots = db.model(ReservableSession.name, ReservableSessionSchema);
    db.model(SessionBooking.name, SessionBookingSchema);
    db.model(ClassEnrollment.name, ClassEnrollmentSchema);
    db.model(TrainingSession.name, TrainingSessionSchema);
    db.model(TrainingClass.name, TrainingClassSchema);
    db.model(Coach.name, CoachSchema);
    db.model(CoachPackagePurchase.name, CoachPackagePurchaseSchema);
    db.model(CoachOffering.name, CoachOfferingSchema);
    db.model(PayoutRequest.name, PayoutRequestSchema);
    service = new CommerceService(
      intents as never,
      callbacks as never,
      ledger as never,
      reservations as never,
      slots as never,
      accounts as never,
      new MockPaymentProvider({
        env: {
          NODE_ENV: "test",
          MOCK_PAYMENT_CALLBACK_SECRET: "integration-payment-secret",
        },
      } as never),
      {
        notifyBookingConfirmed: jest.fn(),
        notifyPaymentFailed: jest.fn(),
      } as never,
      {
        finalizePayment: jest.fn(),
        settleReferral: jest.fn(),
        refundWallet: jest.fn(),
      } as never,
      {} as never,
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
  async function fixture(
    type: "coach_booking" | "coach_class_enrollment",
    approval = false,
  ) {
    const userId = new Types.ObjectId(),
      coachId = new Types.ObjectId(),
      sportId = new Types.ObjectId();
    const start = new Date(Date.now() + 86400000),
      end = new Date(Date.now() + 90000000);
    const common = {
      ownerCoachId: coachId,
      title: "خدمت آزمون",
      sportId,
      deliveryMode: "online",
      capacity: 1,
    };
    const resource =
      type === "coach_booking"
        ? await db.model(TrainingSession.name).create({
            ...common,
            startAt: start,
            endAt: end,
            status: "full",
            bookedCount: 1,
          })
        : await db.model(TrainingClass.name).create({
            ...common,
            normalizedTitle: "test",
            slug: `test-${userId}`,
            courseStartAt: start,
            courseEndAt: end,
            price: { amount: 100000, currency: "IRR" },
            status: "published",
            enrollmentCount: 1,
            enrollmentMode: approval ? "requires_approval" : "automatic",
          });
    const model =
      type === "coach_booking"
        ? db.model(SessionBooking.name)
        : db.model(ClassEnrollment.name);
    const reference = await model.create({
      coachId,
      athleteId: userId,
      ...(type === "coach_booking"
        ? { sessionId: resource._id }
        : { classId: resource._id, createdBy: userId }),
      status: "pending",
      paymentStatus: "pending",
      priceSnapshot: { amount: 100000, currency: "IRR" },
    });
    const input = {
      referenceType: type,
      referenceId: String(reference._id),
      idempotencyKey: `payment-${reference._id}`,
      walletAmount: 0,
      returnUrl: "https://example.test/athlete/reservations",
    };
    return {
      userId: String(userId),
      coachId,
      resource,
      reference,
      model,
      input,
    };
  }
  it.each(["coach_booking", "coach_class_enrollment"] as const)(
    "captures %s once, balances coach ledger, and refunds once",
    async (type) => {
      const f = await fixture(type);
      await expect(
        service.createIntent(String(new Types.ObjectId()), f.input),
      ).rejects.toMatchObject({ code: "REFERENCE_NOT_PAYABLE" });
      const intent = await service.createIntent(f.userId, f.input);
      expect((await service.createIntent(f.userId, f.input)).id).toBe(
        intent.id,
      );
      await service.simulate(f.userId, intent.id, "paid");
      await service.simulate(f.userId, intent.id, "paid");
      expect((await f.model.findById(f.reference._id)).paymentStatus).toBe(
        "paid",
      );
      expect(
        (
          await db
            .model(SettlementAccount.name)
            .findOne({ providerId: f.coachId })
        ).availableAmount,
      ).toBe(90000);
      const entries = await db
        .model(LedgerEntry.name)
        .find({ sourceType: "payment" });
      expect(entries).toHaveLength(3);
      expect(
        entries.reduce(
          (sum, row) =>
            sum + (row.direction === "debit" ? row.amount : -row.amount),
          0,
        ),
      ).toBe(0);
      await service.refundCoaching(type, f.reference._id, 100000);
      await service.refundCoaching(type, f.reference._id, 100000);
      expect(
        (
          await db
            .model(SettlementAccount.name)
            .findOne({ providerId: f.coachId })
        ).availableAmount,
      ).toBe(0);
      expect((await f.model.findById(f.reference._id)).paymentStatus).toBe(
        "refunded",
      );
    },
  );
  it.each(["coach_booking", "coach_class_enrollment"] as const)(
    "failed %s releases capacity once even when finalization is retried",
    async (type) => {
      const f = await fixture(type);
      const intent = await service.createIntent(f.userId, f.input);
      await service.simulate(f.userId, intent.id, "failed");
      await service.simulate(f.userId, intent.id, "failed");
      await new CoachingPaymentReference(db).finalize(
        type,
        f.reference._id,
        false,
        new Types.ObjectId(intent.id),
      );
      expect((await f.model.findById(f.reference._id)).paymentStatus).toBe(
        "failed",
      );
      const resource = await db
        .model(
          type === "coach_booking" ? TrainingSession.name : TrainingClass.name,
        )
        .findById(f.resource._id);
      expect(
        type === "coach_booking"
          ? resource.bookedCount
          : resource.enrollmentCount,
      ).toBe(0);
      if (type === "coach_booking")
        expect(resource.status).toBe("open_for_booking");
      expect(await db.model(LedgerEntry.name).countDocuments()).toBe(0);
    },
  );
  it("preserves coach approval after class payment", async () => {
    const f = await fixture("coach_class_enrollment", true);
    const intent = await service.createIntent(f.userId, f.input);
    await service.simulate(f.userId, intent.id, "paid");
    expect((await f.model.findById(f.reference._id)).status).toBe("pending");
  });
  it.each(["coach_booking", "coach_class_enrollment"] as const)(
    "quotes %s without payment writes and rejects a changed accepted amount",
    async (type) => {
      const f = await fixture(type);
      const quote = await service.quotePayment(f.userId, f.input);
      expect(quote).toMatchObject({
        currency: "IRR",
        grossAmount: 100000,
        amount: 100000,
        discountAmount: 0,
        walletAmount: 0,
        intentId: null,
      });
      expect(await db.model(PaymentIntent.name).countDocuments()).toBe(0);
      await expect(
        service.createIntent(f.userId, { ...f.input, expectedAmount: 99999 }),
      ).rejects.toMatchObject({ code: "PAYMENT_PRICE_CHANGED" });
      expect(await db.model(PaymentIntent.name).countDocuments()).toBe(0);
      const intent = await service.createIntent(f.userId, {
        ...f.input,
        expectedAmount: quote.amount,
      });
      expect((await service.quotePayment(f.userId, f.input)).intentId).toBe(
        intent.id,
      );
    },
  );
  it("does not charge an unsupported currency as rials", async () => {
    const f = await fixture("coach_booking");
    await f.model.updateOne(
      { _id: f.reference._id },
      { $set: { "priceSnapshot.currency": "USD" } },
    );
    await expect(service.quotePayment(f.userId, f.input)).rejects.toMatchObject(
      { code: "UNSUPPORTED_PAYMENT_CURRENCY" },
    );
    expect(await db.model(PaymentIntent.name).countDocuments()).toBe(0);
  });
  it("coalesces concurrent payment attempts with different client keys", async () => {
    const f = await fixture("coach_booking");
    const intents = await Promise.all(
      ["one", "two", "three"].map((key) =>
        service.createIntent(f.userId, { ...f.input, idempotencyKey: key }),
      ),
    );
    expect(new Set(intents.map((intent) => intent.id)).size).toBe(1);
    expect(await db.model(PaymentIntent.name).countDocuments()).toBe(1);
  });
  it.each(["coach_booking", "coach_class_enrollment"] as const)(
    "expires abandoned %s exactly once",
    async (type) => {
      const f = await fixture(type);
      await f.model.updateOne(
        { _id: f.reference._id },
        { $set: { paymentExpiresAt: new Date(Date.now() - 1000) } },
      );
      expect((await service.expirePendingPayments()).errors).toEqual([]);
      expect((await service.expirePendingPayments()).errors).toEqual([]);
      expect((await f.model.findById(f.reference._id)).paymentStatus).toBe(
        "failed",
      );
      const resource = await db
        .model(
          type === "coach_booking" ? TrainingSession.name : TrainingClass.name,
        )
        .findById(f.resource._id);
      expect(
        type === "coach_booking"
          ? resource.bookedCount
          : resource.enrollmentCount,
      ).toBe(0);
    },
  );
  it("ignores an old failure and rejects an old capture after re-enrollment", async () => {
    const f = await fixture("coach_class_enrollment");
    const intent = await service.createIntent(f.userId, f.input);
    await f.model.updateOne(
      { _id: f.reference._id },
      { $set: { registeredAt: new Date(Date.now() + 1000) } },
    );
    await expect(
      service.simulate(f.userId, intent.id, "paid"),
    ).rejects.toMatchObject({ code: "REFERENCE_GENERATION_CHANGED" });
    await service.simulate(f.userId, intent.id, "failed");
    expect((await f.model.findById(f.reference._id)).paymentStatus).toBe(
      "pending",
    );
    expect(
      (await db.model(TrainingClass.name).findById(f.resource._id))
        .enrollmentCount,
    ).toBe(1);
    expect(await db.model(LedgerEntry.name).countDocuments()).toBe(0);
  });
  it("refunds tiny mixed-wallet payments in separate transactions without losing money", async () => {
    const f = await fixture("coach_booking");
    const intent = await service.createIntent(f.userId, f.input);
    await db.model(PaymentIntent.name).updateOne(
      { _id: intent.id },
      {
        $set: { grossAmount: 2, amount: 1, walletAmount: 1, platformFee: 0 },
      },
    );
    await service.simulate(f.userId, intent.id, "paid");
    for (const key of ["first-rial", "second-rial"]) {
      await service.refund(intent.id, {
        amount: 1,
        reason: "tiny refund",
        idempotencyKey: key,
      });
      await service.refund(intent.id, {
        amount: 1,
        reason: "tiny refund",
        idempotencyKey: key,
      });
    }
    const saved = await db.model(PaymentIntent.name).findById(intent.id);
    expect(saved).toMatchObject({
      status: "refunded",
      refundedAmount: 2,
      refundedWalletAmount: 1,
      refundedGatewayAmount: 1,
      refundedDiscountAmount: 0,
    });
    expect(
      (
        await db
          .model(SettlementAccount.name)
          .findOne({ providerId: f.coachId })
      ).availableAmount,
    ).toBe(0);
    const entries = await db.model(LedgerEntry.name).find().lean();
    expect(entries.every((e) => e.amount > 0)).toBe(true);
    expect(
      entries.reduce(
        (sum, e) => sum + (e.direction === "debit" ? e.amount : -e.amount),
        0,
      ),
    ).toBe(0);
  });

  it("scopes refund retry keys to each payment", async () => {
    for (const type of ["coach_booking", "coach_class_enrollment"] as const) {
      const f = await fixture(type);
      const intent = await service.createIntent(f.userId, f.input);
      await service.simulate(f.userId, intent.id, "paid");
      const input = {
        amount: 100000,
        reason: "test refund",
        idempotencyKey: "same-client-refund-key",
      };
      await service.refund(intent.id, input);
      await service.refund(intent.id, input);
      expect((await f.model.findById(f.reference._id)).paymentStatus).toBe(
        "refunded",
      );
    }
    expect(
      await db.model(LedgerEntry.name).countDocuments({ sourceType: "refund" }),
    ).toBe(6);
  });
  it.each([false, true])(
    "refunds after a payout is reserved or paid (paid=%s) and keeps coach debt explicit",
    async (paid) => {
      const f = await fixture("coach_booking");
      const ownerId = new Types.ObjectId();
      await db
        .model(Coach.name)
        .create({ _id: f.coachId, userId: ownerId, slug: `coach-${ownerId}` });
      const payouts = new PayoutsService(
        db.model(PayoutRequest.name) as never,
        db.model(LedgerEntry.name) as never,
        db.model(SettlementAccount.name) as never,
        {} as never,
        { notifyPayoutStatus: jest.fn() } as never,
      );
      const intent = await service.createIntent(f.userId, f.input);
      await service.simulate(f.userId, intent.id, "paid");
      expect(
        (await payouts.balance(String(ownerId), "coach")).availableAmount,
      ).toBe(90000);
      await expect(
        payouts.balance(
          String(new Types.ObjectId()),
          "coach",
          String(f.coachId),
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      const payout = await payouts.request(String(ownerId), {
        providerType: "coach",
        amount: 90000,
        iban: "IR123456789012345678901234",
      });
      if (paid)
        await payouts.review(String(new Types.ObjectId()), payout.id, {
          status: "paid",
          note: "simulated",
        });
      await service.refundCoaching("coach_booking", f.reference._id, 100000);
      expect(await payouts.balance(String(ownerId), "coach")).toMatchObject({
        availableAmount: 0,
        outstandingDebt: 90000,
        reservedAmount: paid ? 0 : 90000,
      });
      if (!paid) {
        await expect(
          payouts.review(String(new Types.ObjectId()), payout.id, {
            status: "paid",
            note: "simulated",
          }),
        ).rejects.toMatchObject({ code: "PAYOUT_REFUND_PENDING" });
        await payouts.cancel(String(ownerId), payout.id);
        expect(await payouts.balance(String(ownerId), "coach")).toMatchObject({
          availableAmount: 0,
          outstandingDebt: 0,
          reservedAmount: 0,
        });
      }
      const entries = await db.model(LedgerEntry.name).find();
      expect(
        entries.reduce(
          (sum, row) =>
            sum + (row.direction === "debit" ? row.amount : -row.amount),
          0,
        ),
      ).toBe(0);
    },
  );
  it("rejects payment creation for a cancelled session", async () => {
    const f = await fixture("coach_booking");
    await db
      .model(TrainingSession.name)
      .updateOne({ _id: f.resource._id }, { $set: { status: "cancelled" } });
    await expect(service.createIntent(f.userId, f.input)).rejects.toMatchObject(
      { code: "SERVICE_NOT_AVAILABLE" },
    );
    expect(await db.model(PaymentIntent.name).countDocuments()).toBe(0);
  });
  it("rolls back capture if ledger persistence fails, then safely retries", async () => {
    const f = await fixture("coach_booking");
    const intent = await service.createIntent(f.userId, f.input);
    const write = jest
      .spyOn(db.model(LedgerEntry.name), "insertMany")
      .mockRejectedValueOnce(new Error("injected persistence failure"));
    await expect(service.simulate(f.userId, intent.id, "paid")).rejects.toThrow(
      "injected persistence failure",
    );
    expect(
      (await db.model(PaymentIntent.name).findById(intent.id)).status,
    ).toBe("pending");
    expect((await f.model.findById(f.reference._id)).paymentStatus).toBe(
      "pending",
    );
    expect(await db.model(SettlementAccount.name).countDocuments()).toBe(0);
    expect(await db.model(LedgerEntry.name).countDocuments()).toBe(0);
    write.mockRestore();
    await service.simulate(f.userId, intent.id, "paid");
    expect(
      (
        await db
          .model(SettlementAccount.name)
          .findOne({ providerId: f.coachId })
      ).availableAmount,
    ).toBe(90000);
  });
  it("rolls back refund balance changes on a ledger failure", async () => {
    const f = await fixture("coach_class_enrollment");
    const intent = await service.createIntent(f.userId, f.input);
    await service.simulate(f.userId, intent.id, "paid");
    const write = jest
      .spyOn(db.model(LedgerEntry.name), "insertMany")
      .mockRejectedValueOnce(new Error("refund interrupted"));
    await expect(
      service.refundCoaching("coach_class_enrollment", f.reference._id, 100000),
    ).rejects.toThrow("refund interrupted");
    expect(
      (
        await db
          .model(SettlementAccount.name)
          .findOne({ providerId: f.coachId })
      ).availableAmount,
    ).toBe(90000);
    expect(
      (await db.model(PaymentIntent.name).findById(intent.id)).refundedAmount,
    ).toBe(0);
    write.mockRestore();
    await service.refundCoaching(
      "coach_class_enrollment",
      f.reference._id,
      100000,
    );
    expect(
      (
        await db
          .model(SettlementAccount.name)
          .findOne({ providerId: f.coachId })
      ).availableAmount,
    ).toBe(0);
  });
  it("rolls back reserved capacity if the order cannot be persisted", async () => {
    const slots = db.model(ReservableSession.name),
      orders = db.model(Reservation.name);
    const slot = await slots.create({
      clubId: new Types.ObjectId(),
      title: "زمین",
      startsAt: new Date(Date.now() + 86400000),
      endsAt: new Date(Date.now() + 90000000),
      capacity: 1,
      reservedCount: 0,
      basePrice: 100000,
      cancellationPolicy: { title: "لغو", tiers: [] },
      status: "active",
    });
    const reservations = new ReservationsService(
      {} as never,
      slots as never,
      orders as never,
      {
        getPublic: async () => ({ operationalStatus: "active", taxPercent: 0 }),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      service,
      {
        expirePaymentHolds: jest
          .fn()
          .mockResolvedValue({ expired: 0, errors: [] }),
      } as never,
    );
    const input = CreateReservationDto.schema.parse({
      sessionId: String(slot._id),
      participantCount: 1,
    });
    const write = jest
      .spyOn(orders, "create")
      .mockRejectedValueOnce(new Error("order interrupted"));
    await expect(
      reservations.reserve(String(new Types.ObjectId()), input),
    ).rejects.toThrow("order interrupted");
    expect((await slots.findById(slot._id)).reservedCount).toBe(0);
    expect(await orders.countDocuments()).toBe(0);
    write.mockRestore();
    const results = await Promise.allSettled(
      [1, 2, 3].map(() =>
        reservations.reserve(String(new Types.ObjectId()), input),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect((await slots.findById(slot._id)).reservedCount).toBe(1);
    expect(await orders.countDocuments()).toBe(1);
  });
  it("runs external effects only after a committed transaction", async () => {
    const effect = jest.fn();
    await expect(
      atomicOperation(db, async () => {
        await afterCommit(effect);
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    expect(effect).not.toHaveBeenCalled();
    await atomicOperation(db, async () => {
      await afterCommit(effect);
      expect(effect).not.toHaveBeenCalled();
    });
    expect(effect).toHaveBeenCalledTimes(1);
  });
  it.each(["paid", "failed"] as const)(
    "settles a coach package %s through the shared payment ledger",
    async (status) => {
      const userId = new Types.ObjectId(),
        coachId = new Types.ObjectId(),
        offeringId = new Types.ObjectId();
      await db.model(Coach.name).collection.insertOne({
        _id: coachId,
        reviewStatus: "approved",
        visibility: "public",
      });
      await db
        .model(CoachOffering.name)
        .collection.insertOne({ _id: offeringId, status: "published" });
      const purchase = await db.model(CoachPackagePurchase.name).create({
        athleteId: userId,
        coachId,
        offeringId,
        title: "بسته آزمون",
        pricingType: "package",
        priceSnapshot: { amount: 100000, currency: "IRR" },
        sessionCount: 3,
        remainingSessions: 3,
        purchasedAt: new Date(),
        paymentExpiresAt: new Date(Date.now() + 900000),
        idempotencyKey: "package-ledger-test",
      });
      const intent = await service.createIntent(String(userId), {
        referenceType: "coach_package_purchase",
        referenceId: String(purchase._id),
        idempotencyKey: "package-payment-test",
        walletAmount: 0,
        returnUrl: "https://example.test/athlete/packages",
      });
      await service.simulate(String(userId), intent.id, status);
      await service.simulate(String(userId), intent.id, status);
      const saved = await db
        .model(CoachPackagePurchase.name)
        .findById(purchase._id);
      expect(saved.status).toBe(status === "paid" ? "active" : "failed");
      expect(saved.remainingSessions).toBe(3);
      if (status === "paid") {
        const entries = await db
          .model(LedgerEntry.name)
          .find({ sourceId: new Types.ObjectId(intent.id) });
        expect(entries.length).toBeGreaterThan(0);
        expect(
          entries.reduce(
            (n, e) => n + (e.direction === "debit" ? e.amount : -e.amount),
            0,
          ),
        ).toBe(0);
        await db
          .model(CoachPackagePurchase.name)
          .updateOne({ _id: purchase._id }, { $set: { usedSessions: 1 } });
        await expect(
          service.refund(intent.id, {
            idempotencyKey: "package-refund-test",
            reason: "test",
          }),
        ).rejects.toMatchObject({ code: "PACKAGE_NOT_REFUNDABLE" });
      }
    },
  );
});
