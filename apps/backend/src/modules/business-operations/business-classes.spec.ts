import { Types } from "mongoose";
import { CreateBusinessClassDto } from "./business-classes.dto";
import { generateBusinessClassSessions } from "./business-classes.service";
import {
  BusinessClassAttendanceSchema,
  BusinessClassEnrollmentSchema,
  BusinessClassSessionSchema,
} from "./schemas/training-class.schema";

const validClass = {
  title: "کلاس بدنسازی",
  description: "",
  sport: "بدنسازی",
  level: "مقدماتی",
  model: "group" as const,
  pricingModel: "monthly" as const,
  price: 1_000_000,
  currency: "IRR",
  packageSessionCount: null,
  capacity: 12,
  coachProfileId: null,
  branchId: null,
  startDate: "2026-09-05",
  endDate: "2026-09-12",
  schedule: [{ dayOfWeek: 6, startTime: "18:00", durationMinutes: 60 }],
  status: "active" as const,
};

describe("business class management", () => {
  it("validates supported class and pricing models", () => {
    expect(CreateBusinessClassDto.schema.safeParse(validClass).success).toBe(
      true,
    );
    expect(
      CreateBusinessClassDto.schema.safeParse({
        ...validClass,
        model: "private",
        capacity: 5,
      }).success,
    ).toBe(false);
    expect(
      CreateBusinessClassDto.schema.safeParse({
        ...validClass,
        pricingModel: "package",
        packageSessionCount: null,
      }).success,
    ).toBe(false);
  });

  it("accepts a shared skill-level resource and keeps legacy text optional", () => {
    const parsed = CreateBusinessClassDto.schema.safeParse({
      ...validClass,
      level: "",
      skillLevelId: String(new Types.ObjectId()),
    });
    expect(parsed.success).toBe(true);
    expect(
      CreateBusinessClassDto.schema.safeParse({
        ...validClass,
        skillLevelId: "not-an-object-id",
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate weekly schedule entries", () => {
    expect(
      CreateBusinessClassDto.schema.safeParse({
        ...validClass,
        schedule: [validClass.schedule[0], validClass.schedule[0]],
      }).success,
    ).toBe(false);
  });

  it("generates recurring sessions in Tehran time", () => {
    const generated = generateBusinessClassSessions({
      _id: new Types.ObjectId(),
      clubId: new Types.ObjectId(),
      startDate: new Date("2026-09-05T00:00:00.000Z"),
      endDate: new Date("2026-09-12T00:00:00.000Z"),
      classModel: "group",
      capacity: 12,
      schedule: [{ dayOfWeek: 6, startTime: "18:00", durationMinutes: 60 }],
    });
    expect(generated).toHaveLength(2);
    expect(generated[0]?.startsAt.toISOString()).toBe(
      "2026-09-05T14:30:00.000Z",
    );
    expect(generated[0]?.endsAt.toISOString()).toBe("2026-09-05T15:30:00.000Z");
  });

  it("protects session, enrollment and attendance identities", () => {
    expect(BusinessClassSessionSchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { classId: 1, startsAt: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
    expect(BusinessClassEnrollmentSchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { classId: 1, studentId: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
    expect(BusinessClassAttendanceSchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { sessionId: 1, studentId: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
  });
});
