import { CreateOfferingDto, GenerateScheduleDto } from "./coaching.dto";

const objectId = "507f1f77bcf86cd799439011";

describe("coaching DTO validation", () => {
  it("requires a session count for package services", () => {
    const result = CreateOfferingDto.schema.safeParse({
      sportId: objectId,
      title: "بسته تمرین خصوصی",
      type: "private",
      deliveryModes: ["club"],
      durationMinutes: 60,
      capacity: 1,
      price: { amount: 1_000_000, currency: "IRR" },
      pricingType: "package",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid timezones in recurring schedules", () => {
    const result = GenerateScheduleDto.schema.safeParse({
      timezone: "Mars/Tehran",
      daysOfWeek: [0, 2],
      startMinute: 1080,
      durationMinutes: 60,
      startDate: "2026-09-03",
      endDate: "2026-10-03",
    });
    expect(result.success).toBe(false);
  });
});
