import { fakeTransactionConnection } from "../../infrastructure/database/atomic-operation.test-helper";
import { Types } from "mongoose";

import { PayoutsService } from "./payouts.service";

describe("PayoutsService", () => {
  const payout = (status: string) => ({
    _id: new Types.ObjectId(),
    requestedBy: new Types.ObjectId(),
    providerType: "club",
    providerId: new Types.ObjectId(),
    amount: 250_000,
    iban: "IR123456789012345678901234",
    status,
    reviewNote: "",
    bankReference: null,
    reviewedAt: new Date(),
    paidAt: null,
    createdAt: new Date(),
  });

  it("moves a request to under review without releasing reserved balance", async () => {
    const item = payout("under_review");
    const payouts = {
      db: fakeTransactionConnection,
      findOneAndUpdate: jest.fn().mockResolvedValue(item),
    };
    const ledger = { insertMany: jest.fn() };
    const accounts = { updateOne: jest.fn() };
    const notifications = { notifyPayoutStatus: jest.fn() };
    const service = new PayoutsService(
      payouts as never,
      ledger as never,
      accounts as never,
      {} as never,
      notifications as never,
    );

    const result = await service.review(
      String(new Types.ObjectId()),
      String(item._id),
      { status: "under_review", note: "مدارک در حال بررسی است" },
    );

    expect(result.status).toBe("under_review");
    expect(accounts.updateOne).not.toHaveBeenCalled();
    expect(ledger.insertMany).not.toHaveBeenCalled();
    expect(notifications.notifyPayoutStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "under_review" }),
    );
  });

  it("lets the requester cancel a pending payout and releases its balance", async () => {
    const item = payout("cancelled");
    const payouts = {
      db: fakeTransactionConnection,
      findOneAndUpdate: jest.fn().mockResolvedValue(item),
    };
    const accounts = { updateOne: jest.fn() };
    const notifications = { notifyPayoutStatus: jest.fn() };
    const service = new PayoutsService(
      payouts as never,
      {} as never,
      accounts as never,
      {} as never,
      notifications as never,
    );

    const result = await service.cancel(
      String(item.requestedBy),
      String(item._id),
    );

    expect(result.status).toBe("cancelled");
    expect(accounts.updateOne).toHaveBeenCalledWith(
      { providerId: item.providerId },
      {
        $inc: {
          reservedAmount: -item.amount,
          availableAmount: item.amount,
        },
      },
    );
  });
});
