import { model, Types } from "mongoose";
import { UpdateCoachProfileDto } from "./coaching.dto";
import { CoachSchema } from "../schemas/coaching.schemas";
import {
  CoachProfessionalProfileSchema,
  publicProfessionalProfile,
} from "./professional-profile";

const credential = {
  title: "مربیگری درجه دو",
  issuer: "فدراسیون",
  year: "۱۴۰۳",
  expiresOn: "2027-09-01",
  mediaId: new Types.ObjectId().toHexString(),
};
const story = {
  title: "پیشرفت تکنیک",
  goal: "یادگیری شنا",
  duration: "۱۲ هفته",
  outcome: "اجرای مستقل تکنیک",
  consent: true as const,
};

describe("professional coach profile", () => {
  it("persists structured details and initializes older profiles without a migration", async () => {
    const CoachModel = model("ProfessionalProfileTestCoach", CoachSchema);
    const profile = CoachProfessionalProfileSchema.parse({
      audience: "  ورزشکاران مبتدی  ",
      levels: ["beginner"],
      credentials: [credential],
      successStories: [story],
    });
    const coach = new CoachModel({
      userId: new Types.ObjectId(),
      slug: "test",
      professionalProfile: profile,
    });
    await expect(coach.validate()).resolves.toBeUndefined();
    const saved = coach.toObject().professionalProfile;
    expect(saved.audience).toBe("ورزشکاران مبتدی");
    expect(saved.credentials[0]).toMatchObject(credential);
    expect(saved.successStories[0]?.consent).toBe(true);
    const olderCoach = new CoachModel({
      userId: new Types.ObjectId(),
      slug: "older",
    });
    expect(olderCoach.toObject().professionalProfile.credentials).toEqual([]);
    expect(publicProfessionalProfile(undefined).levels).toEqual([]);
  });

  it.each([
    "javascript:alert(1)",
    "http://example.com/video",
    "https://user:password@example.com/video",
  ])("rejects unsafe video URL %s", (introductionVideoUrl) => {
    expect(
      UpdateCoachProfileDto.schema.safeParse({
        professionalProfile: { introductionVideoUrl },
      }).success,
    ).toBe(false);
  });

  it("rejects invalid credential dates, self-verification, oversized collections and unconsented stories", () => {
    for (const professionalProfile of [
      { credentials: [{ ...credential, expiresOn: "2027-02-30" }] },
      { credentials: [{ ...credential, verified: true }] },
      { goals: Array(13).fill("افزایش قدرت") },
      { levels: ["beginner", "beginner"] },
      { successStories: [{ ...story, consent: false }] },
    ])
      expect(
        UpdateCoachProfileDto.schema.safeParse({ professionalProfile }).success,
      ).toBe(false);
  });

  it("omits certificate attachments and stories without consent from public responses", () => {
    const value = CoachProfessionalProfileSchema.parse({
      credentials: [credential],
      successStories: [story],
    });
    const result = publicProfessionalProfile(value);
    expect(result.credentials[0]).not.toHaveProperty("mediaId");
    expect(result.credentials[0]).toMatchObject({
      title: credential.title,
      issuer: credential.issuer,
    });
    expect(result.successStories).toHaveLength(1);
    expect(
      publicProfessionalProfile({
        successStories: [{ ...story, consent: false } as never],
      }).successStories,
    ).toEqual([]);
    expect(value.credentials[0]?.mediaId).toBe(credential.mediaId);
  });
});
