import { DiscoveryFeedService } from "./discovery.service";
import { CoachProfessionalProfileSchema } from "../coaching/dto/professional-profile";

it("returns professional details through public discovery without exposing credential attachments", async () => {
  const professionalProfile = CoachProfessionalProfileSchema.parse({
    audience: "ورزشکاران مبتدی",
    credentials: [
      {
        title: "مربیگری درجه دو",
        issuer: "فدراسیون",
        mediaId: "66d400000000000000000023",
      },
    ],
  });
  const coaches = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: "66d400000000000000000021",
        slug: "coach",
        displayName: "مربی",
        bio: "شرح روش آموزش",
        languages: ["فارسی"],
        minAcceptedAge: 18,
        travelRadiusKm: 12,
        geo: { cityId: "66d400000000000000000031", cityRegionIds: [] },
        professionalProfile,
      }),
    }),
  };
  const service = new DiscoveryFeedService(
    {} as never,
    {} as never,
    coaches as never,
    {} as never,
    {} as never,
    {} as never,
    { getReadyByIds: jest.fn().mockResolvedValue([]) } as never,
    {
      get: jest.fn().mockResolvedValue({ name: "تهران", isActive: true }),
    } as never,
    {} as never,
  );
  const result = await service.getPublicCoach("coach");
  expect(coaches.findOne).toHaveBeenCalledWith(
    expect.objectContaining({ reviewStatus: "approved", visibility: "public" }),
  );
  expect(result).toMatchObject({
    bio: "شرح روش آموزش",
    languages: ["فارسی"],
    minAcceptedAge: 18,
    travelRadiusKm: 12,
    serviceArea: [{ type: "city", name: "تهران" }],
    professionalProfile: {
      audience: "ورزشکاران مبتدی",
      credentials: [{ title: "مربیگری درجه دو", issuer: "فدراسیون" }],
    },
  });
  expect(JSON.stringify(result)).not.toContain("66d400000000000000000023");
});
