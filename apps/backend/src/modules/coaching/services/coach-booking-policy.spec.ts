import {
  calculateCoachBookingRefund,
  normalizeCoachCancellationPolicy,
} from "./coach-booking-policy";

describe("coach booking cancellation policy", () => {
  it("normalizes unsafe input and adds the zero-hour fallback", () => {
    expect(
      normalizeCoachCancellationPolicy({
        title: "  خصوصی  ",
        tiers: [{ hoursBefore: 24, refundPercent: 150 }],
        ownerCancellationRefundPercent: 120,
      }),
    ).toEqual({
      title: "خصوصی",
      tiers: [
        { hoursBefore: 24, refundPercent: 100 },
        { hoursBefore: 0, refundPercent: 0 },
      ],
      reservationCutoffMinutes: 0,
      rescheduleCutoffMinutes: 0,
      noShowRefundPercent: 0,
      ownerCancellationRefundPercent: 100,
    });
  });

  it("calculates the athlete refund from the snapshotted tiers", () => {
    const policy = normalizeCoachCancellationPolicy({
      tiers: [
        { hoursBefore: 24, refundPercent: 80 },
        { hoursBefore: 0, refundPercent: 0 },
      ],
    });
    expect(
      calculateCoachBookingRefund(
        1_000_000,
        new Date("2026-09-05T12:00:00.000Z"),
        new Date("2026-09-03T12:00:00.000Z"),
        policy,
      ),
    ).toEqual({ refundPercent: 80, refundAmount: 800_000 });
  });
});
