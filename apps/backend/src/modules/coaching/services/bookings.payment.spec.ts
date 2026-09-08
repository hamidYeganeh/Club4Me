import { Types } from "mongoose";

import { BookingsService } from "./bookings.service";

describe("BookingsService mock payment", () => {
  const athleteId = new Types.ObjectId().toHexString();
  const bookingId = new Types.ObjectId().toHexString();
  const sessionId = new Types.ObjectId();

  function booking(
    status: "pending" | "confirmed" | "rejected",
    paymentStatus: "pending" | "paid" | "failed",
  ) {
    const value = {
      _id: new Types.ObjectId(bookingId),
      sessionId,
      offeringId: new Types.ObjectId(),
      coachId: new Types.ObjectId(),
      athleteId: new Types.ObjectId(athleteId),
      status,
      priceSnapshot: { amount: 750, currency: "IRR" },
      paymentStatus,
      refundPercent: paymentStatus === "failed" ? 0 : null,
      refundAmount: paymentStatus === "failed" ? 0 : null,
      bookedAt: new Date("2029-12-01T10:00:00.000Z"),
    };
    return { ...value, toObject: () => value };
  }

  const session = {
    _id: sessionId,
    title: "جلسه مربی",
    startAt: new Date("2030-01-01T10:00:00.000Z"),
    endAt: new Date("2030-01-01T11:00:00.000Z"),
    deliveryMode: "online",
    venue: { onlineUrl: "https://example.com/session" },
  };

  function setup() {
    const bookings = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    const sessions = {
      findById: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const commerce = {
      createIntent: jest.fn().mockResolvedValue({ id: "intent" }),
      simulate: jest.fn().mockImplementation(async (_user, _intent, status) => {
        bookings.findOne.mockReturnValue({
          exec: async () =>
            booking(status === "paid" ? "confirmed" : "rejected", status),
        });
        return { status };
      }),
    };
    const service = new BookingsService(
      bookings as never,
      sessions as never,
      {} as never,
      {} as never,
      {} as never,
      {
        notifyBookingConfirmed: jest.fn(),
        notifyPaymentFailed: jest.fn(),
      } as never,
      commerce as never,
    );
    return { service, bookings, sessions, commerce };
  }

  it("confirms a coach booking after approved payment", async () => {
    const { service, bookings, sessions, commerce } = setup();
    bookings.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(booking("pending", "pending")),
    });
    bookings.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(booking("confirmed", "paid")),
    });
    sessions.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(session),
    });

    const result = await service.approveMockPayment(athleteId, bookingId);

    expect(result).toMatchObject({
      status: "confirmed",
      paymentStatus: "paid",
    });
  });

  it("rejects payment and reopens coach session capacity", async () => {
    const { service, bookings, sessions, commerce } = setup();
    bookings.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(booking("rejected", "failed")),
    });
    bookings.findOne.mockReturnValue({
      exec: async () => booking("pending", "pending"),
    });
    sessions.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(session),
    });

    const result = await service.rejectMockPayment(athleteId, bookingId);

    expect(result).toMatchObject({
      status: "rejected",
      paymentStatus: "failed",
    });
    expect(commerce.simulate).toHaveBeenCalledWith(
      athleteId,
      "intent",
      "failed",
    );
  });
});
