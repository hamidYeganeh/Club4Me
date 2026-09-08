import { fakeTransactionConnection } from "../../../infrastructure/database/atomic-operation.test-helper";
import { Types } from "mongoose";
import { BookingsService } from "./bookings.service";

describe("standalone coach booking pricing", () => {
  it.each(["package", "per_month"])(
    "does not charge the full %s price for a single session",
    async (pricingType) => {
      const sessions = {
        findById: jest.fn().mockReturnValue({
          exec: async () => ({
            _id: new Types.ObjectId(),
            offeringId: new Types.ObjectId(),
            status: "open_for_booking",
            startAt: new Date("2035-01-01"),
          }),
        }),
        findOneAndUpdate: jest
          .fn()
          .mockResolvedValue({ bookedCount: 1, capacity: 2 }),
      };
      const offerings = {
        findById: jest.fn().mockReturnValue({
          exec: async () => ({ status: "published", pricingType }),
        }),
      };
      const service = new BookingsService(
        {
          db: fakeTransactionConnection,
          findOne: jest.fn().mockResolvedValue(null),
        } as never,
        sessions as never,
        offerings as never,
        { findOneAndUpdate: jest.fn().mockResolvedValue(null) } as never,
        {
          requireCoach: jest.fn().mockResolvedValue({
            reviewStatus: "approved",
            visibility: "public",
          }),
        } as never,
        {} as never,
        {} as never,
      );
      await expect(
        service.book(
          String(new Types.ObjectId()),
          String(new Types.ObjectId()),
        ),
      ).rejects.toMatchObject({ code: "PACKAGE_CREDIT_REQUIRED" });
      expect(sessions.findOneAndUpdate).toHaveBeenCalledTimes(1);
    },
  );
});
