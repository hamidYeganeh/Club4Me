import { calculateRefund } from "./refund-policy";

const startsAt = new Date("2026-09-10T12:00:00.000Z");
const tiers = [
  { hoursBefore: 72, refundPercent: 40 },
  { hoursBefore: 24, refundPercent: 20 },
  { hoursBefore: 0, refundPercent: 0 },
];

describe("calculateRefund", () => {
  it.each([
    ["2026-09-07T11:59:00.000Z", 40, 400],
    ["2026-09-08T12:00:00.000Z", 20, 200],
    ["2026-09-09T13:00:00.000Z", 0, 0],
    ["2026-09-11T12:00:00.000Z", 0, 0],
  ])("applies the snapshot tier at %s", (cancelledAt, percent, amount) => {
    expect(
      calculateRefund(1000, startsAt, new Date(cancelledAt), tiers),
    ).toEqual({
      refundPercent: percent,
      refundAmount: amount,
    });
  });
});
