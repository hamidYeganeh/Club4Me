import { Types } from "mongoose";
import { CoachesService } from "./coaches.service";
import { CoachProfessionalProfileSchema } from "../dto/professional-profile";

function fixture() {
  const coach = {
    _id: new Types.ObjectId(),
    reviewStatus: "draft",
    minAcceptedAge: 18,
    maxAcceptedAge: 60,
    save: jest.fn().mockResolvedValue(undefined),
    toObject: jest.fn(() => ({})),
  };
  const media = { assertOwnedReady: jest.fn().mockResolvedValue(undefined) };
  const service = new CoachesService(
    {} as never,
    {} as never,
    {} as never,
    media as never,
  );
  jest.spyOn(service, "getOrCreateDocument").mockResolvedValue(coach as never);
  return { service, coach, media };
}

describe("coach profile updates", () => {
  it("checks ownership of every credential attachment before saving", async () => {
    const { service, coach, media } = fixture();
    const mediaId = new Types.ObjectId().toHexString();
    const professionalProfile = CoachProfessionalProfileSchema.parse({
      credentials: [{ title: "مدرک مربیگری", issuer: "فدراسیون", mediaId }],
    });
    media.assertOwnedReady.mockRejectedValueOnce(new Error("Not owned"));
    await expect(
      service.updateProfile("user", { professionalProfile }),
    ).rejects.toThrow("Not owned");
    expect(media.assertOwnedReady).toHaveBeenCalledWith("user", [mediaId]);
    expect(coach.save).not.toHaveBeenCalled();
    await service.updateProfile("user", { professionalProfile });
    expect(coach).toHaveProperty("professionalProfile", professionalProfile);
    expect(coach.save).toHaveBeenCalledTimes(1);
  });

  it("validates the merged age range on a partial update and allows clearing a bound", async () => {
    const { service, coach } = fixture();
    await expect(
      service.updateProfile("user", { minAcceptedAge: 70 }),
    ).rejects.toThrow();
    await expect(
      service.updateProfile("user", { maxAcceptedAge: 10 }),
    ).rejects.toThrow();
    expect(coach.save).not.toHaveBeenCalled();
    await service.updateProfile("user", {
      maxAcceptedAge: null,
      minAcceptedAge: 70,
    });
    expect(coach.maxAcceptedAge).toBeNull();
  });

  it("preserves reviewed sport credentials when only the sport selection changes", async () => {
    const sportId = new Types.ObjectId();
    const certificate = new Types.ObjectId();
    const existing = {
      sportId,
      certificateMediaIds: [certificate],
      verificationStatus: "verified",
    };
    const sports = {
      find: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([existing]) }),
      bulkWrite: jest.fn().mockResolvedValue({}),
      deleteMany: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const service = new CoachesService(
      {} as never,
      sports as never,
      { requireActive: jest.fn().mockResolvedValue({}) } as never,
      { assertOwnedReady: jest.fn().mockResolvedValue(undefined) } as never,
    );
    jest
      .spyOn(service, "getOrCreateDocument")
      .mockResolvedValue({ _id: new Types.ObjectId() } as never);
    jest.spyOn(service, "listSports").mockResolvedValue({ items: [] });
    const input = {
      sportId: String(sportId),
      specialtyIds: [],
      experienceYears: 5,
      certificateMediaIds: [String(certificate)],
      achievements: ["قهرمانی"],
      customAttributes: {},
    };
    await service.replaceSports("user", [input]);
    expect(
      sports.bulkWrite.mock.calls[0][0][0].updateOne.update.$set,
    ).toMatchObject({
      verificationStatus: "verified",
      achievements: ["قهرمانی"],
      experienceYears: 5,
    });
    await service.replaceSports("user", [
      { ...input, certificateMediaIds: [String(new Types.ObjectId())] },
    ]);
    expect(
      sports.bulkWrite.mock.calls[1][0][0].updateOne.update.$set
        .verificationStatus,
    ).toBe("pending");
  });
});
