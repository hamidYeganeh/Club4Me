import { Types } from "mongoose";

import { AttendanceService } from "./attendance.service";

describe("AttendanceService", () => {
  const sessionId = new Types.ObjectId().toHexString();
  const classId = new Types.ObjectId();
  const athleteId = new Types.ObjectId();
  const bookingAthleteId = new Types.ObjectId();
  const session = {
    _id: new Types.ObjectId(sessionId),
    classId,
    title: "جلسه آزمایشی",
    startAt: new Date("2030-01-01T10:00:00.000Z"),
    endAt: new Date("2030-01-01T11:00:00.000Z"),
  };

  it("combines active class students and confirmed direct bookings", async () => {
    const attendance = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    };
    const enrollments = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            athleteId,
          },
        ]),
      }),
    };
    const bookings = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            athleteId: bookingAthleteId,
          },
        ]),
      }),
    };
    const sessions = {
      requireOwnedDocument: jest.fn().mockResolvedValue(session),
    };
    const users = {
      findManyByIds: jest.fn().mockResolvedValue([
        { id: athleteId.toHexString(), firstName: "علی" },
        { id: bookingAthleteId.toHexString(), firstName: "سارا" },
      ]),
    };
    const service = new AttendanceService(
      attendance as never,
      enrollments as never,
      bookings as never,
      sessions as never,
      users as never,
    );

    const result = await service.list(
      new Types.ObjectId().toHexString(),
      sessionId,
    );

    expect(result.items).toHaveLength(2);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          athleteId: athleteId.toHexString(),
          sourceType: "enrollment",
          status: "unrecorded",
        }),
        expect.objectContaining({
          athleteId: bookingAthleteId.toHexString(),
          sourceType: "booking",
          status: "unrecorded",
        }),
      ]),
    );
  });
});
