import { Types } from "mongoose";

import { ClassRemindersService } from "./class-reminders.service";

describe("ClassRemindersService", () => {
  it("sends a reminder only to linked active students", async () => {
    const classId = new Types.ObjectId();
    const session = {
      _id: new Types.ObjectId(),
      classId,
      startsAt: new Date(Date.now() + 24 * 60 * 60_000),
    };
    const studentId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const sessionResults = [[session], []];
    const sessions = {
      find: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockResolvedValue(sessionResults.shift() ?? []),
      })),
      findOneAndUpdate: jest.fn().mockResolvedValue(session),
    };
    const notifications = { notifyBookingReminder: jest.fn() };
    const service = new ClassRemindersService(
      sessions as never,
      {
        findById: jest.fn().mockResolvedValue({ _id: classId, title: "یوگا" }),
      } as never,
      { find: jest.fn().mockResolvedValue([{ studentId }]) } as never,
      {
        find: jest.fn().mockResolvedValue([{ _id: studentId, userId }]),
      } as never,
      notifications as never,
      { eval: jest.fn().mockResolvedValue(1) } as never,
      { env: { NODE_ENV: "test" } } as never,
    );

    const result = await service.run();

    expect(result).toEqual({ skipped: false, sent: 1 });
    expect(notifications.notifyBookingReminder).toHaveBeenCalledWith(
      expect.objectContaining({ userId, title: "یوگا" }),
    );
  });
});
