import { Types } from "mongoose";

import { SupportSlaService } from "./support-sla.service";

describe("SupportSlaService", () => {
  it("claims an overdue ticket and notifies admins once", async () => {
    const ticket = {
      _id: new Types.ObjectId(),
      subject: "تیکت بدون پاسخ",
      firstRespondedAt: null,
      slaBreachedAt: null,
      escalationLevel: 0,
      slaDueAt: new Date(Date.now() - 60_000),
    };
    const tickets = {
      updateMany: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([ticket]),
        }),
      }),
      findOneAndUpdate: jest.fn().mockResolvedValue(ticket),
    };
    const adminId = new Types.ObjectId();
    const notifications = { notifySupportEscalated: jest.fn() };
    const service = new SupportSlaService(
      tickets as never,
      { eval: jest.fn().mockResolvedValue(1) } as never,
      {
        env: {
          NODE_ENV: "test",
          SUPPORT_SLA_NORMAL_MINUTES: 480,
          SUPPORT_SLA_HIGH_MINUTES: 120,
          SUPPORT_SLA_URGENT_MINUTES: 30,
        },
      } as never,
      { findIdsByRole: jest.fn().mockResolvedValue([adminId]) } as never,
      notifications as never,
    );

    const result = await service.run();

    expect(result).toEqual({ skipped: false, escalated: 1 });
    expect(notifications.notifySupportEscalated).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: [adminId], level: 1 }),
    );
  });
});
