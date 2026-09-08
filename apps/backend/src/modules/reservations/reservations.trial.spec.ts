import { fakeTransactionConnection } from "../../infrastructure/database/atomic-operation.test-helper";
import { Types } from "mongoose";
import { ReservationsService } from "./reservations.service";

describe("trial reservations", () => {
  const userId = new Types.ObjectId().toHexString();
  const sessionId = new Types.ObjectId();
  function setup(enabled = true) {
    const session = {
      _id: sessionId,
      clubId: new Types.ObjectId(),
      startsAt: new Date("2035-01-01"),
      endsAt: new Date("2035-01-02"),
      title: "جلسه",
      capacity: 10,
      reservedCount: 0,
      basePrice: 500,
      currency: "IRR",
      options: [],
      cancellationPolicy: { reservationCutoffMinutes: 0 },
      pricingUnit: "per_participant",
    };
    const sessions = {
      findOne: jest.fn().mockReturnValue({ exec: async () => session }),
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: async () => session }),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: async () => ({ modifiedCount: 1 }) }),
    };
    const reservations = {
      db: fakeTransactionConnection,
      exists: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (payload) => ({
        ...payload,
        createdAt: new Date(),
        cancelledAt: null,
      })),
    };
    const entitlements = {
      reserveForReservation: jest.fn(),
      assertEligibleForReservation: jest.fn(),
      finalizeReservation: jest.fn(),
    };
    const notifications = {
      notifyBookingConfirmed: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ReservationsService(
      {} as never,
      sessions as never,
      reservations as never,
      {
        getPublic: async () => ({
          trialBookingEnabled: enabled,
          operationalStatus: "active",
        }),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      notifications as never,
      {} as never,
      entitlements as never,
    );
    return { service, sessions, reservations, entitlements, notifications };
  }
  it.each([{ expectedTotalPrice: 100 }, { expectedCurrency: "USD" }])(
    "rejects stale price confirmation before consuming inventory %j",
    async (expected) => {
      const { service, sessions } = setup();
      await expect(
        service.reserve(userId, {
          sessionId: String(sessionId),
          participantCount: 1,
          ...expected,
        }),
      ).rejects.toMatchObject({ code: "RESERVATION_PRICE_CHANGED" });
      expect(sessions.findOneAndUpdate).not.toHaveBeenCalled();
    },
  );
  it("does not quote membership coverage when server eligibility rejects it", async () => {
    const { service, entitlements, sessions } = setup();
    entitlements.assertEligibleForReservation.mockRejectedValue({
      code: "ENTITLEMENT_NOT_ELIGIBLE",
    });
    await expect(
      service.quote(userId, {
        sessionId: String(sessionId),
        participantCount: 1,
        entitlementId: new Types.ObjectId().toHexString(),
      }),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_NOT_ELIGIBLE" });
    expect(entitlements.reserveForReservation).not.toHaveBeenCalled();
    expect(sessions.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it("quotes cannot promise unavailable group capacity", async () => {
    const { service, sessions } = setup();
    await expect(
      service.quote(userId, {
        sessionId: String(sessionId),
        participantCount: 11,
      }),
    ).rejects.toMatchObject({ code: "SESSION_CAPACITY_UNAVAILABLE" });
    expect(sessions.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it("books at zero price without payment or membership consumption", async () => {
    const { service, entitlements } = setup();
    const result = await service.reserve(userId, {
      sessionId: String(sessionId),
      participantCount: 1,
      isTrial: true,
    });
    expect(result).toMatchObject({
      totalPrice: 0,
      isTrial: true,
      paymentStatus: "not_required",
      status: "reserved",
    });
    expect(entitlements.reserveForReservation).not.toHaveBeenCalled();
  });
  it("keeps regular paid bookings paid", async () => {
    const { service } = setup();
    expect(
      await service.reserve(userId, {
        sessionId: String(sessionId),
        participantCount: 2,
      }),
    ).toMatchObject({
      totalPrice: 1000,
      paymentStatus: "pending",
      isTrial: false,
    });
  });
  it("rejects trials when the owner disabled them", async () => {
    const { service, sessions } = setup(false);
    await expect(
      service.reserve(userId, {
        sessionId: String(sessionId),
        participantCount: 1,
        isTrial: true,
      }),
    ).rejects.toMatchObject({ code: "TRIAL_NOT_AVAILABLE" });
    expect(sessions.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it.each([
    { participantCount: 2 },
    { participantCount: 1, entitlementId: new Types.ObjectId().toHexString() },
    {
      participantCount: 1,
      options: [{ optionId: new Types.ObjectId().toHexString(), quantity: 1 }],
    },
  ])(
    "rejects trial extras and group/membership bookings %j",
    async (payload) => {
      const { service } = setup();
      await expect(
        service.reserve(userId, {
          sessionId: String(sessionId),
          isTrial: true,
          ...payload,
        }),
      ).rejects.toMatchObject({ code: "INVALID_TRIAL_BOOKING" });
    },
  );
  it("rejects an already used trial before claiming capacity", async () => {
    const { service, reservations, sessions } = setup();
    reservations.exists.mockResolvedValue({ _id: "used" });
    await expect(
      service.reserve(userId, {
        sessionId: String(sessionId),
        participantCount: 1,
        isTrial: true,
      }),
    ).rejects.toMatchObject({ code: "TRIAL_ALREADY_USED" });
    expect(sessions.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it("rejects a duplicate trial without compensating inside an aborted transaction", async () => {
    const { service, reservations, sessions } = setup();
    reservations.create.mockRejectedValue({ code: 11000 });
    await expect(
      service.reserve(userId, {
        sessionId: String(sessionId),
        participantCount: 1,
        isTrial: true,
      }),
    ).rejects.toMatchObject({ code: "TRIAL_ALREADY_USED" });
    expect(sessions.updateOne).not.toHaveBeenCalled();
  });
  it("does not release a confirmed trial seat if notification delivery fails", async () => {
    const { service, sessions, notifications } = setup();
    notifications.notifyBookingConfirmed.mockRejectedValue(
      new Error("notification unavailable"),
    );
    expect(
      await service.reserve(userId, {
        sessionId: String(sessionId),
        participantCount: 1,
        isTrial: true,
      }),
    ).toMatchObject({ status: "reserved", paymentStatus: "not_required" });
    expect(sessions.updateOne).not.toHaveBeenCalled();
  });
});
