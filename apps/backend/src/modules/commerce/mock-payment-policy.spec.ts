import { ReservationsService } from "../reservations/reservations.service";
import { BusinessClassPortalService } from "../business-operations/class-portal.service";
import { assertMockPaymentsEnabled } from "./mock-payment-policy";
import { BookingsService } from "../coaching/services/bookings.service";
import { EnrollmentsService } from "../coaching/services/enrollments.service";

describe("production payment safety", () => {
  it("blocks simulation in production and permits isolated test environments", () => {
    expect(() => assertMockPaymentsEnabled("production")).toThrow();
    expect(() => assertMockPaymentsEnabled("test")).not.toThrow();
    expect(() =>
      assertMockPaymentsEnabled("production", "simulation"),
    ).not.toThrow();
    expect(() => assertMockPaymentsEnabled("test", "disabled")).toThrow();
  });
  it("rejects coach payment decisions before touching any order", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      for (const service of [
        BookingsService,
        EnrollmentsService,
        ReservationsService,
      ]) {
        for (const action of [
          "approveMockPayment",
          "rejectMockPayment",
        ] as const) {
          await expect(
            (
              service.prototype[action] as (
                this: unknown,
                userId: string,
                orderId: string,
              ) => Promise<unknown>
            ).call(Object.create(service.prototype), "athlete", "order"),
          ).rejects.toMatchObject({ code: "MOCK_PAYMENT_DISABLED" });
        }
      }
      await expect(
        BusinessClassPortalService.prototype.resolvePayment.call(
          Object.create(BusinessClassPortalService.prototype),
          "athlete",
          "order",
          "approve",
        ),
      ).rejects.toMatchObject({ code: "MOCK_PAYMENT_DISABLED" });
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
