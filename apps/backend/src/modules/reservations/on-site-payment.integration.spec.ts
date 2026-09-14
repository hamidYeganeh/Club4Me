import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryReplSet } from "../../../test/mongo-memory";
import { ReservationsService } from "./reservations.service";
import { Reservation, ReservationSchema } from "./schemas/reservation.schema";
import {
  ReservableSession,
  ReservableSessionSchema,
} from "./schemas/reservable-session.schema";
import { Court, CourtSchema } from "./schemas/court.schema";
import { CreateReservationDto } from "./dto/reservation.dto";
import { Club, ClubSchema } from "../clubs/schemas/club.schema";

describe("on-site reservation payment lifecycle", () => {
  jest.setTimeout(60000);
  let mongo: MongoMemoryReplSet;
  let db: Connection;
  let service: ReservationsService;
  const user = String(new Types.ObjectId()),
    owner = String(new Types.ObjectId()),
    club = String(new Types.ObjectId());
  const commerce = { refundReservation: jest.fn() };
  const clubs = {
    getPublic: async (id: string) => db.model(Club.name).findById(id).lean(),
    get: jest.fn(async (actor: string, _club: string, permission: string) => {
      if (
        actor !== owner ||
        !["payments.write", "reservations.write"].includes(permission)
      )
        throw new Error("Forbidden");
      return {};
    }),
  };
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    db = await createConnection(mongo.getUri()).asPromise();
    const reservations = db.model(Reservation.name, ReservationSchema);
    const sessions = db.model(ReservableSession.name, ReservableSessionSchema);
    const courts = db.model(Court.name, CourtSchema);
    db.model(Club.name, ClubSchema);
    await Promise.all([reservations.init(), sessions.init(), courts.init()]);
    service = new ReservationsService(
      courts as never,
      sessions as never,
      reservations as never,
      clubs as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        notifyBookingConfirmed: async () => {},
        notifyBookingCancelled: async () => {},
      } as never,
      commerce as never,
      { finalizeReservation: async () => {} } as never,
    );
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    await db.model(Club.name).create({
      _id: club,
      ownerId: owner,
      name: "باشگاه",
      normalizedName: "باشگاه",
      slug: "payment-club",
      onSitePaymentMethods: ["cash", "pos"],
    });
  });
  afterEach(async () => {
    await Promise.all(
      Object.values(db.collections).map((c) => c.deleteMany({})),
    );
    jest.clearAllMocks();
  });
  async function session() {
    return db.model(ReservableSession.name).create({
      clubId: new Types.ObjectId(club),
      title: "سانس",
      startsAt: new Date(Date.now() + 86400000),
      endsAt: new Date(Date.now() + 90000000),
      capacity: 2,
      basePrice: 500000,
      pricingUnit: "per_session",
      cancellationPolicy: {
        title: "لغو",
        tiers: [{ hoursBefore: 0, refundPercent: 100 }],
        ownerCancellationRefundPercent: 100,
      },
    });
  }
  async function reserve(method: "online" | "cash" | "pos") {
    const slot = await session();
    return service.reserve(user, {
      sessionId: String(slot._id),
      participantCount: 1,
      paymentMethod: method,
    });
  }
  it("keeps the gateway for legacy clubs and rejects disabled methods at submission", async () => {
    const slot = await session();
    const input = { sessionId: String(slot._id), participantCount: 1 };
    await db
      .model(Club.name)
      .updateOne({ _id: club }, { $unset: { onSitePaymentMethods: 1 } });
    expect((await service.quote(user, input)).availablePaymentMethods).toEqual([
      "online",
    ]);
    await expect(
      service.reserve(user, { ...input, paymentMethod: "cash" }),
    ).rejects.toMatchObject({ code: "RESERVATION_PAYMENT_METHOD_UNAVAILABLE" });
    await db
      .model(Club.name)
      .updateOne({ _id: club }, { $set: { onSitePaymentMethods: ["cash"] } });
    expect((await service.quote(user, input)).availablePaymentMethods).toEqual([
      "online",
      "cash",
    ]);
    await expect(
      service.reserve(user, { ...input, paymentMethod: "pos" }),
    ).rejects.toMatchObject({ code: "RESERVATION_PAYMENT_METHOD_UNAVAILABLE" });
    // An owner can disable cash after the athlete received a quote.
    await db
      .model(Club.name)
      .updateOne({ _id: club }, { $set: { onSitePaymentMethods: [] } });
    await expect(
      service.reserve(user, { ...input, paymentMethod: "cash" }),
    ).rejects.toMatchObject({ code: "RESERVATION_PAYMENT_METHOD_UNAVAILABLE" });
    expect(await db.model(Reservation.name).countDocuments()).toBe(0);
    expect(
      (await db.model(ReservableSession.name).findById(slot._id))
        ?.reservedCount,
    ).toBe(0);
    expect((await service.reserve(user, input)).paymentMethod).toBe("online");
  });
  it.each(["cash", "pos"] as const)(
    "persists %s as due at venue without gateway expiry",
    async (paymentMethod) => {
      const item = await reserve(paymentMethod);
      expect(item).toMatchObject({
        paymentMethod,
        paymentStatus: "pay_on_arrival",
        paymentExpiresAt: null,
        totalPrice: 500000,
      });
      expect((await service.listMine(user)).items[0]?.paymentMethod).toBe(
        paymentMethod,
      );
    },
  );
  it("preserves online payment holds and rejects unsupported methods", async () => {
    const item = await reserve("online");
    expect(item.paymentStatus).toBe("pending");
    expect(item.paymentExpiresAt).not.toBeNull();
    expect(
      CreateReservationDto.schema.safeParse({
        sessionId: String(new Types.ObjectId()),
        participantCount: 1,
        paymentMethod: "crypto",
      }).success,
    ).toBe(false);
  });
  it("requires venue permission and the server amount, then collects idempotently", async () => {
    const item = await reserve("cash");
    const input = {
      action: "collect" as const,
      expectedAmount: 500000,
      receipt: "cash-1",
    };
    await expect(
      service.recordOnSitePayment(user, club, item.id, input),
    ).rejects.toThrow("Forbidden");
    await expect(
      service.recordOnSitePayment(
        owner,
        String(new Types.ObjectId()),
        item.id,
        input,
      ),
    ).rejects.toThrow();
    await expect(
      service.recordOnSitePayment(owner, club, item.id, {
        ...input,
        expectedAmount: 1,
      }),
    ).rejects.toThrow();
    const results = await Promise.all([
      service.recordOnSitePayment(owner, club, item.id, input),
      service.recordOnSitePayment(owner, club, item.id, input),
    ]);
    expect(results.every((r) => r.paymentStatus === "paid")).toBe(true);
    expect(results[0]?.collectedOnSiteAt).toBe(results[1]?.collectedOnSiteAt);
    expect(clubs.get).toHaveBeenCalledWith(owner, club, "payments.write");
  });
  it("cancels unpaid cash with no refund and cannot collect it afterwards", async () => {
    const item = await reserve("cash");
    expect(await service.cancel(user, item.id)).toMatchObject({
      status: "cancelled",
      refundAmount: 0,
    });
    await expect(
      service.recordOnSitePayment(owner, club, item.id, {
        action: "collect",
        expectedAmount: 500000,
        receipt: "",
      }),
    ).rejects.toThrow();
    expect(commerce.refundReservation).not.toHaveBeenCalled();
  });
  it("records venue refunds only after collection and cancellation, without gateway money movement", async () => {
    const item = await reserve("pos");
    const input = { expectedAmount: 500000, receipt: "pos-1" };
    await expect(
      service.recordOnSitePayment(owner, club, item.id, {
        ...input,
        action: "refund",
      }),
    ).rejects.toThrow();
    await service.recordOnSitePayment(owner, club, item.id, {
      ...input,
      action: "collect",
    });
    expect(await service.cancel(user, item.id)).toMatchObject({
      paymentStatus: "paid",
      refundAmount: 500000,
    });
    const refunded = await service.recordOnSitePayment(owner, club, item.id, {
      ...input,
      action: "refund",
    });
    expect(refunded.paymentStatus).toBe("refunded");
    expect(refunded.refundedOnSiteAt).toBeTruthy();
    expect(
      await service.recordOnSitePayment(owner, club, item.id, {
        ...input,
        action: "refund",
      }),
    ).toEqual(refunded);
    expect(commerce.refundReservation).not.toHaveBeenCalled();
  });
});
