import { Types } from "mongoose";

import { SupportService } from "./support.service";

describe("SupportService", () => {
  it("records first response time and a private call note", async () => {
    const now = new Date();
    const ticket = {
      _id: new Types.ObjectId(),
      requesterId: new Types.ObjectId(),
      subject: "پیگیری پرداخت",
      category: "payment",
      preferredContact: "phone",
      priority: "high",
      status: "in_progress",
      assigneeId: null,
      messages: [],
      internalNotes: [],
      slaDueAt: new Date(now.getTime() + 60_000),
      firstRespondedAt: null,
      slaBreachedAt: null,
      escalationLevel: 0,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const tickets = {
      findById: jest.fn().mockResolvedValue(ticket),
      findOneAndUpdate: jest.fn().mockImplementation((_filter, update) =>
        Promise.resolve({
          ...ticket,
          ...update.$set,
          messages: [],
          internalNotes: [],
        }),
      ),
    };
    const service = new SupportService(
      tickets as never,
      { notifyTicketUpdated: jest.fn() } as never,
      {
        env: {
          SUPPORT_SLA_NORMAL_MINUTES: 480,
          SUPPORT_SLA_HIGH_MINUTES: 120,
          SUPPORT_SLA_URGENT_MINUTES: 30,
        },
      } as never,
    );

    await service.update(String(new Types.ObjectId()), String(ticket._id), {
      status: "in_progress",
      reply: "در حال بررسی تراکنش شما هستیم.",
      internalNote: "تماس تلفنی انجام شد.",
      callOutcome: "contacted",
    });

    const update = tickets.findOneAndUpdate.mock.calls[0]?.[1];
    expect(update.$set.firstRespondedAt).toBeInstanceOf(Date);
    expect(update.$push.messages.authorType).toBe("agent");
    expect(update.$push.internalNotes.callOutcome).toBe("contacted");
  });
});
