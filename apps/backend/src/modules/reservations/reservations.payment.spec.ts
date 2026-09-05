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
    const sessions = { updateOne: jest.fn() };
    const reservations = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    const service = new ReservationsService(
      {} as never,
      sessions as never,
      reservations as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        notifyBookingConfirmed: jest.fn(),
        notifyPaymentFailed: jest.fn(),
      } as never,
      { refundReservation: jest.fn() } as never,
      { finalizeReservation: jest.fn() } as never,
    );
    return { service, sessions, reservations };
  }

  it("approves a pending payment and keeps the reservation active", async () => {
    const { service, reservations } = setup();
    reservations.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(reservation("pending")),
    });
    reservations.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(reservation("paid")),
    });

    const result = await service.approveMockPayment(userId, reservationId);

    expect(result).toMatchObject({
      status: "reserved",
      paymentStatus: "paid",
    });
  });

  it("rejects payment and releases participant and option capacity", async () => {
    const { service, sessions, reservations } = setup();
    reservations.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(reservation("failed")),
    });
    sessions.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    const result = await service.rejectMockPayment(userId, reservationId);

    expect(result).toMatchObject({
      status: "cancelled",
      paymentStatus: "failed",
      refundAmount: 0,
    });
    expect(sessions.updateOne).toHaveBeenCalledWith(
      { _id: sessionId },
      {
        $inc: expect.objectContaining({
          reservedCount: -2,
          "options.$[option0].reservedQuantity": -1,
        }),
      },
      expect.objectContaining({ arrayFilters: expect.any(Array) }),
    );
  });

  it("releases a reservation without sending empty option filters", async () => {
    const { service, sessions, reservations } = setup();
    const rejected = { ...reservation("failed"), selectedOptions: [] };
    reservations.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(rejected),
    });
    sessions.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    await service.rejectMockPayment(userId, reservationId);

    expect(sessions.updateOne).toHaveBeenCalledWith(
      { _id: sessionId },
      { $inc: { reservedCount: -2 } },
      {},
    );
  });
});
