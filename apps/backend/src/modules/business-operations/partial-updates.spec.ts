import {
  CreateStudentDto,
  UpdateStudentDto,
  CreateCoachDto,
  UpdateCoachDto,
  CreateBranchDto,
  UpdateBranchDto,
} from "./business-operations.dto";
import {
  CreateBusinessClassDto,
  UpdateBusinessClassDto,
} from "./business-classes.dto";

describe("business partial updates preserve omitted fields", () => {
  it.each([
    ["student", UpdateStudentDto.schema, { firstName: "نام جدید" }],
    ["coach", UpdateCoachDto.schema, { firstName: "نام جدید" }],
    ["branch", UpdateBranchDto.schema, { name: "نام جدید" }],
    ["class", UpdateBusinessClassDto.schema, { title: "عنوان جدید" }],
  ])(
    "does not reset %s data when only the name changes",
    (_, schema, payload) => {
      expect(schema.parse(payload)).toEqual(payload);
      expect(schema.parse({})).toEqual({});
      expect(schema.safeParse({ unknownField: true }).success).toBe(false);
    },
  );
  it("allows explicit clearing and deactivation", () => {
    const payload = { notes: "", membershipEndsAt: null, status: "inactive" };
    expect(UpdateStudentDto.schema.parse(payload)).toEqual(payload);
    expect(
      UpdateCoachDto.schema.parse({ specialties: [], status: "inactive" }),
    ).toEqual({ specialties: [], status: "inactive" });
    expect(
      UpdateBusinessClassDto.schema.parse({
        coachProfileId: null,
        visibility: "private",
        enrollmentMode: "requires_approval",
        status: "paused",
      }),
    ).toEqual({
      coachProfileId: null,
      visibility: "private",
      enrollmentMode: "requires_approval",
      status: "paused",
    });
  });
  it("keeps create defaults and update validation", () => {
    const person = {
      firstName: "نام",
      lastName: "آزمون",
      phone: "09121111111",
    };
    expect(CreateStudentDto.schema.parse(person)).toMatchObject({
      status: "active",
      notes: "",
      membershipEndsAt: null,
    });
    expect(CreateCoachDto.schema.parse(person)).toMatchObject({
      status: "active",
      specialties: [],
    });
    expect(
      CreateBranchDto.schema.parse({ name: "شعبه", address: "نشانی آزمایشی" }),
    ).toMatchObject({ timezone: "Asia/Tehran", status: "active" });
    expect(
      UpdateBusinessClassDto.schema.safeParse({
        model: "private",
        capacity: 10,
      }).success,
    ).toBe(false);
    expect(
      UpdateBusinessClassDto.schema.safeParse({
        startDate: "2030-02-01",
        endDate: "2030-01-01",
      }).success,
    ).toBe(false);
    expect(
      CreateBusinessClassDto.schema.safeParse({ title: "ناقص" }).success,
    ).toBe(false);
  });
});
