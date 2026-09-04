import type { ResourcesService } from "../resources/resources.service";
import type { MediaService } from "../media/media.service";
import type { ClubsRepository } from "./clubs.repository";
import { ClubsService } from "./clubs.service";
import { ClubFieldsSchema } from "./dto/club-fields.dto";
import type { ClubMembershipsService } from "./club-memberships.service";

describe("ClubsService", () => {
  const repository = {
    create: jest.fn(),
    update: jest.fn(),
  };
  const resources = {
    requireActive: jest.fn(),
  };
  const media = { assertOwnedReady: jest.fn().mockResolvedValue(undefined) };
  const memberships = { ensureOwner: jest.fn().mockResolvedValue(undefined) };
  const service = new ClubsService(
    repository as unknown as ClubsRepository,
    resources as unknown as ResourcesService,
    media as unknown as MediaService,
    memberships as unknown as ClubMembershipsService,
    { notifyOwnerApproved: jest.fn() } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    resources.requireActive.mockImplementation(
      (_category: string, segment: string, id: string) =>
        Promise.resolve({
          id,
          isActive: true,
          ...(segment === "province" ? { countryId: "country" } : {}),
          ...(segment === "city" ? { provinceId: "province" } : {}),
          ...(segment === "district" || segment === "city-region"
            ? { cityId: "city" }
            : {}),
        }),
    );
  });

  it("validates catalog references before creating a club", async () => {
    repository.create.mockResolvedValue({ id: "club" });
    await service.create("owner", {
      name: "باشگاه تست",
      clubTypeIds: ["507f1f77bcf86cd799439011"],
      equipment: [{ resourceId: "507f1f77bcf86cd799439012", quantity: 2 }],
      amenities: [{ resourceId: "507f1f77bcf86cd799439013", quantity: 1 }],
    });

    expect(resources.requireActive).toHaveBeenCalledTimes(3);
    expect(repository.create).toHaveBeenCalled();
  });

  it("rejects a mismatched location hierarchy", async () => {
    resources.requireActive.mockImplementation(
      (_category: string, segment: string, id: string) =>
        Promise.resolve({
          id,
          isActive: true,
          ...(segment === "province" ? { countryId: "another-country" } : {}),
          ...(segment === "city" ? { provinceId: "province" } : {}),
        }),
    );

    await expect(
      service.create("owner", {
        name: "باشگاه تست",
        location: {
          countryId: "country",
          provinceId: "province",
          cityId: "city",
          address: "تهران، خیابان تست",
          latitude: 35.7,
          longitude: 51.4,
        },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "CLUB_LOCATION_HIERARCHY_INVALID",
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("accepts a complete decreasing cancellation policy", () => {
    const result = ClubFieldsSchema.safeParse({
      name: "باشگاه تست",
      cancellationRules: [
        {
          title: "آخر هفته",
          tiers: [
            { hoursBefore: 72, refundPercent: 40 },
            { hoursBefore: 24, refundPercent: 20 },
            { hoursBefore: 0, refundPercent: 0 },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("requires a zero-hour cancellation fallback", () => {
    const result = ClubFieldsSchema.safeParse({
      name: "باشگاه تست",
      cancellationRules: [
        {
          title: "روزهای عادی",
          tiers: [{ hoursBefore: 24, refundPercent: 20 }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("stores email and website as social media contacts", () => {
    const result = ClubFieldsSchema.safeParse({
      name: "باشگاه تست",
      socialMedia: [
        { platform: "email", link: "hello@club.example" },
        { platform: "website", link: "https://club.example" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid social media contact values", () => {
    const result = ClubFieldsSchema.safeParse({
      name: "باشگاه تست",
      socialMedia: [{ platform: "email", link: "not-an-email" }],
    });
    expect(result.success).toBe(false);
  });
});
