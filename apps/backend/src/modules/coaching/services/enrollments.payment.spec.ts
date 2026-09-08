import { Types } from "mongoose";

import { EnrollmentsService } from "./enrollments.service";

describe("EnrollmentsService mock payment", () => {
  const athleteId = new Types.ObjectId().toHexString();
  const enrollmentId = new Types.ObjectId().toHexString();
  const classId = new Types.ObjectId();

  const trainingClass = {
    _id: classId,
    title: "کلاس بدنسازی",
    slug: "demo-fitness-class",
    courseStartAt: new Date("2030-01-01T10:00:00.000Z"),
    courseEndAt: new Date("2030-02-01T10:00:00.000Z"),
    deliveryMode: "club",
    enrollmentMode: "automatic",
    venue: null,
  };

  function enrollment(
    status: "pending" | "active" | "rejected",
    paymentStatus: "pending" | "paid" | "failed",
  ) {
    const value = {
      _id: new Types.ObjectId(enrollmentId),
      classId,
      coachId: new Types.ObjectId(),
      athleteId: new Types.ObjectId(athleteId),
      status,
      priceSnapshot: { amount: 1_500_000, currency: "IRR" },
      paymentStatus,
      refundPercent: paymentStatus === "failed" ? 0 : null,
      refundAmount: paymentStatus === "failed" ? 0 : null,
      registeredAt: new Date("2029-12-01T10:00:00.000Z"),
    };
    return { ...value, toObject: () => value };
  }

  function setup() {
    const enrollments = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    const classes = {
      findById: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const notifications = {
      notifyBookingConfirmed: jest.fn(),
      notifyPaymentFailed: jest.fn(),
    };
    const commerce = {
      createIntent: jest.fn().mockResolvedValue({ id: "intent" }),
      simulate: jest.fn().mockImplementation(async (_user, _intent, status) => {
        enrollments.findOne.mockReturnValue({
          exec: async () =>
            enrollment(status === "paid" ? "active" : "rejected", status),
        });
        return { status };
      }),
    };
    const service = new EnrollmentsService(
      enrollments as never,
      classes as never,
      {} as never,
      {} as never,
      notifications as never,
      commerce as never,
    );
    classes.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(trainingClass),
    });
    return { service, enrollments, classes, notifications, commerce };
  }

  it("activates an automatic class enrollment after approved payment", async () => {
    const { service, enrollments, commerce } = setup();
    enrollments.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(enrollment("pending", "pending")),
    });
    enrollments.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(enrollment("active", "paid")),
    });

    const result = await service.approveMockPayment(athleteId, enrollmentId);

    expect(result).toMatchObject({ status: "active", paymentStatus: "paid" });
    expect(commerce.simulate).toHaveBeenCalledWith(athleteId, "intent", "paid");
  });

  it("rejects payment and releases the reserved class capacity", async () => {
    const { service, enrollments, commerce } = setup();
    enrollments.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(enrollment("rejected", "failed")),
    });
    enrollments.findOne.mockReturnValue({
      exec: async () => enrollment("pending", "pending"),
    });

    const result = await service.rejectMockPayment(athleteId, enrollmentId);

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
