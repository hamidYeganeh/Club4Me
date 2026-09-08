import { paymentDeadline } from "./payment-deadline";

describe("payment deadline", () => {
  it("uses configured hold time and never exceeds the service start", () => {
    const now = Date.parse("2030-01-01T10:00:00Z");
    expect(paymentDeadline(undefined, now, 7).getTime()).toBe(now + 7 * 60000);
    expect(paymentDeadline(new Date(now + 60000), now, 7).getTime()).toBe(
      now + 60000,
    );
  });
  it.each([0, -1, 121, 1.5, NaN])("rejects invalid minutes %s", (minutes) => {
    expect(() => paymentDeadline(undefined, 0, minutes)).toThrow();
  });
});
