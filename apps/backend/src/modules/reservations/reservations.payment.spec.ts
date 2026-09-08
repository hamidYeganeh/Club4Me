import { fakeTransactionConnection } from "../../infrastructure/database/atomic-operation.test-helper";
import { Types } from "mongoose";

import { ReservationsService } from "./reservations.service";

describe("ReservationsService mock payment", () => {
  const userId = new Types.ObjectId().toHexString();
  const reservationId = new Types.ObjectId().toHexString();
  const sessionId = new Types.ObjectId();

  function reservation(paymentStatus: "pending" | "paid" | "failed") {
    return {
      _id: new Types.ObjectId(reservationId),
      clubId: new Types.ObjectId(),
      sessionId,
      userId: new Types.ObjectId(userId),
      sessionTitle: "سانس باشگاه",
      sessionStartsAt: new Date("2030-01-01T10:00:00.000Z"),
      sessionEndsAt: new Date("2030-01-01T11:00:00.000Z"),
      participantCount: 2,
      selectedOptions: [
        {
          optionId: new Types.ObjectId(),
          type: "equipment",
          resourceId: new Types.ObjectId(),
          quantity: 1,
          unitPrice: 100,
        },
      ],
      totalPrice: 500,
      paymentStatus,
      cancellationPolicy: { tiers: [] },
      refundPercent: paymentStatus === "failed" ? 0 : null,
      refundAmount: paymentStatus === "failed" ? 0 : null,
      status: paymentStatus === "failed" ? "cancelled" : "reserved",
      createdAt: new Date("2029-12-01T10:00:00.000Z"),
      cancelledAt:
        paymentStatus === "failed"
          ? new Date("2029-12-02T10:00:00.000Z")
          : null,
    };
  }

  function setup() {
    let current = reservation("pending");
    const reservations = {
      db: fakeTransactionConnection,
      findOne: jest.fn(() => ({ exec: jest.fn(async () => current) })),
      findOneAndUpdate: jest.fn(),
    };
    const commerce = {
      createIntent: jest.fn().mockResolvedValue({ id: "intent" }),
      simulate: jest.fn(
        async (_user: string, _intent: string, status: "paid" | "failed") => {
          current = reservation(status);
        },
      ),
    };
    const service = new ReservationsService(
      {} as never,
      {} as never,
      reservations as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      commerce as never,
      {} as never,
    );
    return { service, reservations, commerce };
  }
  it("uses shared commerce to capture payment so refunds have a ledger-backed intent", async () => {
    const { service, commerce, reservations } = setup();
    await expect(
      service.approveMockPayment(userId, reservationId),
    ).resolves.toMatchObject({ paymentStatus: "paid", status: "reserved" });
    expect(commerce.createIntent).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        referenceType: "reservation",
        referenceId: reservationId,
      }),
    );
    expect(commerce.simulate).toHaveBeenCalledWith(userId, "intent", "paid");
    expect(reservations.findOneAndUpdate).not.toHaveBeenCalled();
    await service.approveMockPayment(userId, reservationId);
    expect(commerce.simulate).toHaveBeenCalledTimes(1);
  });
  it("delegates failed payments and capacity release to the same commerce workflow", async () => {
    const { service, commerce } = setup();
    await expect(
      service.rejectMockPayment(userId, reservationId),
    ).resolves.toMatchObject({ paymentStatus: "failed", status: "cancelled" });
    expect(commerce.simulate).toHaveBeenCalledWith(userId, "intent", "failed");
  });
  it("checks ownership before creating or deciding any payment", async () => {
    const { service, commerce, reservations } = setup();
    reservations.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.approveMockPayment(userId, reservationId),
    ).rejects.toThrow();
    expect(commerce.createIntent).not.toHaveBeenCalled();
  });
});
