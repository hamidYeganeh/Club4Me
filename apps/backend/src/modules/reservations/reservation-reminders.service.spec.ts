import { Types } from "mongoose";

import { ReservationRemindersService } from "./reservation-reminders.service";

describe("ReservationRemindersService", () => {
  it("atomically claims and sends a due reminder", async () => {
    const reservation = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      sessionTitle: "سانس فوتسال",
      sessionStartsAt: new Date(Date.now() + 24 * 60 * 60_000),
    };
    const queryResults = [[reservation], []];
    const reservations = {
      find: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockResolvedValue(queryResults.shift() ?? []),
      })),
      findOneAndUpdate: jest.fn().mockResolvedValue(reservation),
    };
    const notifications = { notifyBookingReminder: jest.fn() };
    const service = new ReservationRemindersService(
      reservations as never,
      notifications as never,
      { eval: jest.fn().mockResolvedValue(1) } as never,
      { env: { NODE_ENV: "test" } } as never,
    );

    const result = await service.run();

    expect(result).toEqual({ skipped: false, sent: 1 });
    expect(notifications.notifyBookingReminder).toHaveBeenCalledTimes(1);
    expect(reservations.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: reservation._id }),
      expect.objectContaining({ $set: expect.any(Object) }),
      { new: true },
    );
  });
});
