import { ClubFieldsSchema } from "./club-fields.dto";
import { UpdateClubDto } from "./update-club.dto";
import { CreateClubReviewDto } from "../../reviews/dto/create-club-review.dto";

describe("professional club profile validation", () => {
  it("accepts old club creation without new fields", () => {
    expect(ClubFieldsSchema.safeParse({ name: "باشگاه" }).success).toBe(true);
  });
  it("accepts detailed facilities, trial switch, gallery metadata and hourly estimates", () => {
    expect(
      ClubFieldsSchema.safeParse({
        name: "باشگاه",
        trialBookingEnabled: true,
        profile: {
          spaces: [
            {
              name: "استخر",
              roofType: "retractable",
              poolLengthMeters: 25,
              poolLaneCount: 6,
              poolMinDepthMeters: 1.2,
              poolMaxDepthMeters: 2.5,
            },
          ],
          firstVisit: { arrivalMinutesBefore: 15 },
        },
        gallery: [
          {
            mediaId: "507f1f77bcf86cd799439011",
            category: "entrance",
            takenOn: "2024-02-01",
          },
        ],
        busyHours: [{ dayOfWeek: 6, hour: 18, level: "busy" }],
      }).success,
    ).toBe(true);
  });
  it.each([
    {
      profile: {
        spaces: [
          { name: "استخر", poolMinDepthMeters: 3, poolMaxDepthMeters: 1 },
        ],
      },
    },
    { profile: { classCapacity: 1.5 } },
    { busyHours: [{ dayOfWeek: 6, hour: 24, level: "busy" }] },
    {
      busyHours: [
        { dayOfWeek: 1, hour: 8, level: "quiet" },
        { dayOfWeek: 1, hour: 8, level: "busy" },
      ],
    },
    { verifications: { identity: { verifiedAt: new Date().toISOString() } } },
    { busyHoursSource: "live" },
    { trialBookingEnabled: "true" },
  ])("rejects invalid or owner-forged input %j", (input) => {
    expect(UpdateClubDto.schema.safeParse(input).success).toBe(false);
  });
  it("accepts id-keyed dynamic review criteria and rejects legacy/fabricated keys and invalid scores", () => {
    expect(
      CreateClubReviewDto.schema.safeParse({
        rating: 5,
        ratings: { "507f1f77bcf86cd799439011": 4 },
      }).success,
    ).toBe(true);
    expect(
      CreateClubReviewDto.schema.safeParse({
        rating: 5,
        ratings: { cleanliness: 4 },
      }).success,
    ).toBe(false);
    expect(
      CreateClubReviewDto.schema.safeParse({
        rating: 5,
        ratings: { "507f1f77bcf86cd799439011": 6 },
      }).success,
    ).toBe(false);
  });
});
