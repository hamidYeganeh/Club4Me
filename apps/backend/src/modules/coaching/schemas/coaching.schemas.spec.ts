import {
  ClassEnrollmentSchema,
  CoachSchema,
  CoachSportSchema,
  SessionAttendanceSchema,
  SessionBookingSchema,
  TrainingClassSchema,
  TrainingSessionSchema,
} from "./coaching.schemas";

describe("coaching persistence schemas", () => {
  it("keeps one coach profile per user", () => {
    expect(CoachSchema.path("userId").options.unique).toBe(true);
  });

  it("keeps one sport record per coach and sport", () => {
    expect(CoachSportSchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ coachId: 1, sportId: 1 }, expect.objectContaining({ unique: true })],
      ]),
    );
  });

  it("protects class, booking and attendance identities", () => {
    expect(ClassEnrollmentSchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { classId: 1, athleteId: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
    expect(SessionBookingSchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { sessionId: 1, athleteId: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
    expect(SessionAttendanceSchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { sessionId: 1, athleteId: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
  });

  it("indexes public class discovery and coach calendar queries", () => {
    expect(TrainingClassSchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ status: 1, sportId: 1, courseStartAt: 1 }, expect.any(Object)],
      ]),
    );
    expect(TrainingSessionSchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ ownerCoachId: 1, startAt: 1 }, expect.any(Object)],
      ]),
    );
    expect(TrainingClassSchema.path("courtId")).toBeDefined();
    expect(TrainingClassSchema.path("clubApprovalStatus")).toBeDefined();
  });
});
