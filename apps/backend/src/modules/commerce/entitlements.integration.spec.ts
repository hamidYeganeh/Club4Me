import { MembershipRemindersService } from "./membership-reminders.service";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Model, Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import { ClubsService } from "../clubs/clubs.service";
import { EntitlementsService } from "./entitlements.service";
import {
  BenefitProduct,
  BenefitProductDocument,
  BenefitProductSchema,
  BenefitPurchase,
  BenefitPurchaseSchema,
  EntitlementUsage,
  EntitlementUsageSchema,
  UserEntitlement,
  UserEntitlementDocument,
  UserEntitlementSchema,
} from "./schemas/entitlement.schema";

describe("EntitlementsService integration", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryReplSet;
  let service: EntitlementsService;
  let products: Model<BenefitProductDocument>;
  let entitlements: Model<UserEntitlementDocument>;

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: BenefitProduct.name, schema: BenefitProductSchema },
          { name: BenefitPurchase.name, schema: BenefitPurchaseSchema },
          { name: UserEntitlement.name, schema: UserEntitlementSchema },
          { name: EntitlementUsage.name, schema: EntitlementUsageSchema },
        ]),
      ],
      providers: [
        EntitlementsService,
        {
          provide: ClubsService,
          useValue: { get: jest.fn(), getPublic: jest.fn() },
        },
      ],
    }).compile();
    service = moduleRef.get(EntitlementsService);
    products = moduleRef.get(getModelToken(BenefitProduct.name));
    entitlements = moduleRef.get(getModelToken(UserEntitlement.name));
  });

  afterAll(async () => {
    await products.db.close();
    await mongo.stop();
  });

  it("allows only one concurrent reservation to consume the last pack session", async () => {
    const userId = new Types.ObjectId().toHexString();
    const clubId = new Types.ObjectId();
    const product = await products.create({
      clubId,
      title: "بسته تک‌جلسه",
      description: "آزمون مصرف اتمیک",
      type: "session_pack",
      price: 100_000,
      sessionCount: 1,
      validityDays: 30,
      weeklyLimit: null,
      sessionTypes: ["class"],
      status: "active",
    });
    const purchase = await service.createPurchase(userId, String(product._id));
    await products.updateOne(
      { _id: product._id },
      { $set: { sessionCount: 99, validityDays: 1, sessionTypes: ["court"] } },
    );
    const entitlement = await service.finalizePurchase(
      new Types.ObjectId(purchase.id),
      true,
    );
    expect(entitlement).toBeTruthy();

    const quoteInput = {
      entitlementId: String(entitlement!._id),
      userId,
      clubId,
      sessionType: "class" as const,
      sessionStartsAt: new Date(Date.now() + 86_400_000),
    };
    await service.assertEligibleForReservation(quoteInput);
    await service.assertEligibleForReservation(quoteInput);
    expect((await service.listMine(userId)).items[0]?.remainingSessions).toBe(
      1,
    );
    for (const changed of [
      { userId: new Types.ObjectId().toHexString() },
      { clubId: new Types.ObjectId() },
      { sessionType: "court" as const },
      { sessionStartsAt: new Date(Date.now() + 60 * 86_400_000) },
    ]) {
      await expect(
        service.assertEligibleForReservation({ ...quoteInput, ...changed }),
      ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
    }

    const reserve = () =>
      service.reserveForReservation({
        entitlementId: String(entitlement!._id),
        reservationId: new Types.ObjectId(),
        userId,
        clubId,
        sessionType: "class",
        sessionStartsAt: new Date(Date.now() + 86_400_000),
      });
    const results = await Promise.allSettled([reserve(), reserve()]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    await expect(
      service.assertEligibleForReservation(quoteInput),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
    const mine = await service.listMine(userId);
    expect(mine.items[0]).toMatchObject({
      remainingSessions: 0,
      status: "exhausted",
    });
  });
  async function grant(
    type: "time_membership" | "session_pack" = "time_membership",
    maxPauseDays = 0,
  ) {
    const userId = new Types.ObjectId().toHexString();
    const clubId = new Types.ObjectId();
    const product = await products.create({
      clubId,
      title: "عضویت آزمون",
      maxPauseDays,
      type,
      price: 100_000,
      sessionCount: type === "session_pack" ? 1 : null,
      validityDays: 90,
      weeklyLimit: type === "time_membership" ? 1 : null,
      sessionTypes: ["court"],
      status: "active",
    });
    const purchase = await service.createPurchase(userId, String(product._id));
    const entitlement = await service.finalizePurchase(
      new Types.ObjectId(purchase.id),
      true,
    );
    const input = {
      userId,
      clubId,
      entitlementId: String(entitlement!._id),
      sessionType: "court" as const,
      sessionStartsAt: new Date(Date.now() + 86_400_000),
    };
    return { input, entitlement: entitlement!, purchase };
  }

  it("keeps separate weekly limits across alternating weeks and restores only the cancelled week", async () => {
    const { input } = await grant();
    const firstId = new Types.ObjectId();
    const nextWeek = {
      ...input,
      sessionStartsAt: new Date(
        input.sessionStartsAt.getTime() + 7 * 86_400_000,
      ),
    };
    await service.reserveForReservation({ ...input, reservationId: firstId });
    await service.reserveForReservation({
      ...nextWeek,
      reservationId: new Types.ObjectId(),
    });
    for (const week of [input, nextWeek]) {
      await expect(
        service.assertEligibleForReservation(week),
      ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
      await expect(
        service.reserveForReservation({
          ...week,
          reservationId: new Types.ObjectId(),
        }),
      ).rejects.toMatchObject({ code: "ENTITLEMENT_LIMIT_REACHED" });
    }
    await service.finalizeReservation(firstId, false);
    await service.finalizeReservation(firstId, false);
    await service.assertEligibleForReservation(input);
    const results = await Promise.allSettled(
      [1, 2, 3].map(() =>
        service.reserveForReservation({
          ...input,
          reservationId: new Types.ObjectId(),
        }),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    await expect(
      service.assertEligibleForReservation(nextWeek),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
  });

  it("snapshots the Iranian week and restores only the original Saturday bucket", async () => {
    const userId = String(new Types.ObjectId());
    const clubId = new Types.ObjectId();
    const product = await service.createProduct(userId, String(clubId), {
      title: "عضویت هفتگی",
      description: "",
      type: "time_membership",
      price: 100000,
      validityDays: 90,
      weeklyLimit: 1,
      sessionCount: null,
      sessionTypes: ["court"],
      maxPauseDays: 0,
    });
    expect(product.weekCalendar).toBe("iran_saturday");
    const purchase = await service.createPurchase(userId, product.id);
    await products.updateOne(
      { _id: product.id },
      { $set: { weekCalendar: "iso_utc" } },
    );
    const entitlement = (await service.finalizePurchase(
      new Types.ObjectId(purchase.id),
      true,
    ))!;
    expect(entitlement.weekCalendar).toBe("iran_saturday");
    const saturday = new Date(Date.now() + 14 * 86400000);
    saturday.setUTCHours(20, 30, 0, 0);
    saturday.setUTCDate(
      saturday.getUTCDate() + ((5 - saturday.getUTCDay() + 7) % 7),
    );
    const friday = new Date(saturday.getTime() - 1);
    const input = {
      entitlementId: String(entitlement._id),
      userId,
      clubId,
      sessionType: "court" as const,
    };
    const oldId = new Types.ObjectId();
    await service.reserveForReservation({
      ...input,
      reservationId: oldId,
      sessionStartsAt: friday,
    });
    await service.reserveForReservation({
      ...input,
      reservationId: new Types.ObjectId(),
      sessionStartsAt: saturday,
    });
    const monday = new Date(saturday.getTime() + 2 * 86400000);
    await expect(
      service.assertEligibleForReservation({
        ...input,
        sessionStartsAt: monday,
      }),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
    await service.finalizeReservation(oldId, false);
    await service.assertEligibleForReservation({
      ...input,
      sessionStartsAt: friday,
    });
    await expect(
      service.assertEligibleForReservation({
        ...input,
        sessionStartsAt: saturday,
      }),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
  });

  it("retains legacy weekly counters when booking a different week", async () => {
    const { input, entitlement } = await grant();
    await service.reserveForReservation({
      ...input,
      reservationId: new Types.ObjectId(),
    });
    await entitlements.updateOne(
      { _id: entitlement._id },
      { $unset: { weeklyReservations: 1 } },
    );
    await service.reserveForReservation({
      ...input,
      reservationId: new Types.ObjectId(),
      sessionStartsAt: new Date(
        input.sessionStartsAt.getTime() + 7 * 86_400_000,
      ),
    });
    await expect(
      service.assertEligibleForReservation(input),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
  });

  it("does not reactivate a revoked pack when a booking is cancelled", async () => {
    const { input, purchase } = await grant("session_pack");
    const reservationId = new Types.ObjectId();
    await service.reserveForReservation({ ...input, reservationId });
    await service.finalizeReservation(reservationId, true);
    await service.refundPurchase(new Types.ObjectId(purchase.id));
    await service.finalizeReservation(reservationId, false);
    expect((await service.listMine(input.userId)).items[0]).toMatchObject({
      status: "revoked",
      remainingSessions: 1,
    });
  });

  it("paginates owned usage, reports consumption and release, and rejects foreign access", async () => {
    const { input, entitlement } = await grant();
    const reservationId = new Types.ObjectId();
    await service.reserveForReservation({ ...input, reservationId });
    await service.finalizeReservation(reservationId, true);
    expect(
      (await service.listUsage(input.userId, input.entitlementId)).items[0],
    ).toMatchObject({
      reservationId: String(reservationId),
      status: "consumed",
    });
    await service.finalizeReservation(reservationId, false);
    const usages = products.db.collection("entitlement_usages");
    await usages.insertMany(
      Array.from({ length: 20 }, (_, index) => ({
        entitlementId: entitlement._id,
        userId: new Types.ObjectId(input.userId),
        reservationId: new Types.ObjectId(),
        sessionStartsAt: new Date(
          input.sessionStartsAt.getTime() + index * 1000,
        ),
        status: "released",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    const first = await service.listUsage(
      input.userId,
      input.entitlementId,
      1,
      20,
    );
    const last = await service.listUsage(
      input.userId,
      input.entitlementId,
      2,
      20,
    );
    expect(first).toMatchObject({ total: 21, totalPages: 2 });
    expect(first.items).toHaveLength(20);
    expect(last.items).toHaveLength(1);
    expect(
      new Set([...first.items, ...last.items].map((item) => item.id)).size,
    ).toBe(21);
    expect(
      [...first.items, ...last.items].every(
        (item) => item.status === "released",
      ),
    ).toBe(true);
    expect(first.items[0]).not.toHaveProperty("userId");
    await expect(
      service.listUsage(
        new Types.ObjectId().toHexString(),
        input.entitlementId,
      ),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_FOUND" });
    await expect(
      service.listUsage(input.userId, input.entitlementId, NaN),
    ).rejects.toMatchObject({ code: "INVALID_PAGINATION" });
  });
  it("enforces snapshotted pause policy, ownership, quota, audit and early resume", async () => {
    const { input, entitlement } = await grant("time_membership", 5);
    await products.updateOne(
      { _id: entitlement.productId },
      { $set: { maxPauseDays: 0 } },
    );
    await expect(
      service.pause(new Types.ObjectId().toHexString(), input.entitlementId, 2),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_FOUND" });
    await expect(
      service.pause(input.userId, input.entitlementId, 6),
    ).rejects.toMatchObject({ code: "MEMBERSHIP_PAUSE_LIMIT" });
    const paused = await service.pause(input.userId, input.entitlementId, 2);
    expect(
      new Date(paused.endsAt).getTime() - entitlement.endsAt.getTime(),
    ).toBe(2 * 86_400_000);
    expect(paused.remainingPauseDays).toBe(3);
    await expect(
      service.assertEligibleForReservation(input),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
    await expect(
      service.reserveForReservation({
        ...input,
        reservationId: new Types.ObjectId(),
      }),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_LIMIT_REACHED" });
    await expect(
      service.pause(input.userId, input.entitlementId, 1),
    ).rejects.toMatchObject({ code: "MEMBERSHIP_ALREADY_PAUSED" });
    const resumed = await service.resume(input.userId, input.entitlementId);
    expect(
      new Date(resumed.endsAt).getTime() - entitlement.endsAt.getTime(),
    ).toBeLessThan(5000);
    expect(resumed.remainingPauseDays).toBeGreaterThan(4.99);
    expect(resumed.changes.map((c) => c.action)).toEqual(["pause", "resume"]);
    expect(
      (await service.resume(input.userId, input.entitlementId)).endsAt,
    ).toBe(resumed.endsAt);
    await service.assertEligibleForReservation(input);
    const old = await grant();
    await expect(
      service.pause(old.input.userId, old.input.entitlementId, 1),
    ).rejects.toMatchObject({ code: "MEMBERSHIP_PAUSE_LIMIT" });
  });

  it("rejects pause with booked sessions and serializes concurrent pauses", async () => {
    const { input, entitlement } = await grant("time_membership", 7);
    const reservationId = new Types.ObjectId();
    await service.reserveForReservation({ ...input, reservationId });
    await expect(
      service.pause(input.userId, input.entitlementId, 3),
    ).rejects.toMatchObject({ code: "PAUSE_HAS_RESERVATIONS" });
    await service.finalizeReservation(reservationId, false);
    const results = await Promise.allSettled([
      service.pause(input.userId, input.entitlementId, 2),
      service.pause(input.userId, input.entitlementId, 2),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await entitlements.findById(entitlement._id))!.pauseUsedMs).toBe(
      2 * 86_400_000,
    );
  });

  it("keeps future reservations valid when early resume would shorten their contract", async () => {
    const { input, entitlement } = await grant("time_membership", 5);
    await service.pause(input.userId, input.entitlementId, 3);
    const reservationId = new Types.ObjectId();
    await service.reserveForReservation({
      ...input,
      reservationId,
      sessionStartsAt: new Date(entitlement.endsAt.getTime() + 86_400_000),
    });
    await expect(
      service.resume(input.userId, input.entitlementId),
    ).rejects.toMatchObject({ code: "RESUME_HAS_LATE_RESERVATIONS" });
    await service.finalizeReservation(reservationId, false);
    await service.resume(input.userId, input.entitlementId);
  });

  it("stacks concurrent paid renewals after expiry and supports immediate plan changes without rewriting the old contract", async () => {
    const { input, entitlement } = await grant("time_membership", 5);
    const options = {
      renewedFromId: input.entitlementId,
      startMode: "after_expiry" as const,
    };
    await expect(
      service.createPurchase(
        new Types.ObjectId().toHexString(),
        String(entitlement.productId),
        options,
      ),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_FOUND" });
    const purchases = await Promise.all([
      service.createPurchase(
        input.userId,
        String(entitlement.productId),
        options,
      ),
      service.createPurchase(
        input.userId,
        String(entitlement.productId),
        options,
      ),
    ]);
    const renewals = (
      await Promise.all(
        purchases.map((p) =>
          service.finalizePurchase(new Types.ObjectId(p.id), true),
        ),
      )
    ).sort((a, b) => a!.startsAt.getTime() - b!.startsAt.getTime());
    expect(renewals[0]!.startsAt.getTime()).toBe(entitlement.endsAt.getTime());
    expect(renewals[1]!.startsAt.getTime()).toBe(renewals[0]!.endsAt.getTime());
    await service.finalizePurchase(new Types.ObjectId(purchases[0]!.id), true);
    expect(
      await entitlements.countDocuments({ renewedFromId: entitlement._id }),
    ).toBe(2);
    expect(
      (await entitlements.findById(entitlement._id))!.endsAt.getTime(),
    ).toBe(entitlement.endsAt.getTime());
    await expect(
      service.pause(input.userId, input.entitlementId, 1),
    ).rejects.toMatchObject({ code: "PAUSE_HAS_RENEWAL" });
    const changedPlan = await products.create({
      clubId: input.clubId,
      title: "پلن جدید",
      type: "session_pack",
      price: 200000,
      sessionCount: 10,
      validityDays: 30,
      sessionTypes: ["class"],
    });
    const immediate = await service.createPurchase(
      input.userId,
      String(changedPlan._id),
      { renewedFromId: input.entitlementId, startMode: "immediate" },
    );
    const renewed = await service.finalizePurchase(
      new Types.ObjectId(immediate.id),
      true,
    );
    expect(renewed!.startsAt.getTime()).toBeLessThan(
      entitlement.endsAt.getTime(),
    );
    expect(renewed!.remainingSessions).toBe(10);
    expect(
      (await entitlements.findById(entitlement._id))!.sessionTypes,
    ).toEqual(["court"]);
  });
  it("sends one expiry reminder, retries a failed transaction, and skips paid future renewals", async () => {
    const { input, entitlement } = await grant();
    const endsAt = new Date(Date.now() + 2 * 86_400_000);
    await entitlements.updateOne(
      { _id: entitlement._id },
      { $set: { endsAt } },
    );
    const notifications = {
      notifyMembershipExpiring: jest
        .fn()
        .mockRejectedValueOnce(new Error("outbox unavailable")),
    };
    const worker = () =>
      new MembershipRemindersService(
        entitlements,
        notifications as never,
        { env: { NODE_ENV: "test" } } as never,
      );
    await expect(worker().run()).rejects.toThrow("outbox unavailable");
    expect(
      (await entitlements.findById(entitlement._id))!.expiryRemindedFor,
    ).toBeNull();
    notifications.notifyMembershipExpiring.mockResolvedValue(undefined);
    await Promise.all([worker().run(), worker().run()]);
    await worker().run();
    expect(notifications.notifyMembershipExpiring).toHaveBeenCalledTimes(2);
    const later = await grant();
    await entitlements.updateOne(
      { _id: later.entitlement._id },
      { $set: { endsAt } },
    );
    const purchase = await service.createPurchase(
      later.input.userId,
      String(later.entitlement.productId),
      { renewedFromId: later.input.entitlementId, startMode: "after_expiry" },
    );
    await service.finalizePurchase(new Types.ObjectId(purchase.id), true);
    await worker().run();
    expect(notifications.notifyMembershipExpiring).toHaveBeenCalledTimes(2);
    await service.refundPurchase(new Types.ObjectId(purchase.id));
    await worker().run();
    expect(notifications.notifyMembershipExpiring).toHaveBeenCalledTimes(3);
  });
});
