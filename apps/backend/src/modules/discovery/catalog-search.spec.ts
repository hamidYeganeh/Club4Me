import { Types } from "mongoose";
import { DiscoveryFeedService } from "./discovery.service";

function model(items: unknown[] = [], total = items.length) {
  const chain = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn().mockResolvedValue(items),
  };
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return {
    ...chain,
    find: jest.fn().mockReturnValue(chain),
    countDocuments: jest.fn().mockResolvedValue(total),
    distinct: jest.fn().mockResolvedValue([]),
  };
}
function setup() {
  const clubs = model();
  const business = model();
  const service = new DiscoveryFeedService(
    {} as never,
    clubs as never,
    model() as never,
    model() as never,
    model() as never,
    model() as never,
    { getReadyByIds: jest.fn().mockResolvedValue([]) } as never,
    {} as never,
    business as never,
  );
  return { service, clubs, business };
}

describe("catalog search", () => {
  it("counts clubs using the same spherical radius and retains public-only filters", async () => {
    const { service, clubs } = setup();
    await service.listPublicClubs({
      latitude: "35.7",
      longitude: "51.4",
      radiusKm: "10",
      page: "2",
      limit: "20",
    });
    expect(clubs.find).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewStatus: "approved",
        visibility: "public",
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [51.4, 35.7] },
            $maxDistance: 10000,
          },
        },
      }),
    );
    expect(clubs.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        location: {
          $geoWithin: { $centerSphere: [[51.4, 35.7], 10000 / 6378137] },
        },
        visibility: "public",
      }),
    );
    expect(clubs.skip).toHaveBeenCalledWith(20);
  });
  it("searches only active public business classes belonging to approved nearby clubs", async () => {
    const { service, clubs, business } = setup();
    const id = new Types.ObjectId();
    clubs.distinct.mockResolvedValue([id]);
    await service.listPublicBusinessClasses({
      q: "یوگا",
      latitude: "35",
      longitude: "51",
      page: "2",
      limit: "5",
    });
    expect(clubs.distinct).toHaveBeenCalledWith(
      "_id",
      expect.objectContaining({
        reviewStatus: "approved",
        visibility: "public",
        location: expect.any(Object),
      }),
    );
    expect(business.find).toHaveBeenCalledWith(
      expect.objectContaining({
        clubId: { $in: [id] },
        visibility: "public",
        status: "active",
        $or: expect.arrayContaining([{ title: /[یيى]وگا/i }]),
      }),
    );
    expect(business.skip).toHaveBeenCalledWith(5);
  });
  it("passes page through every requested source and exposes correct grouped page count", async () => {
    const { service } = setup();
    const coaches = jest.spyOn(service, "listPublicCoaches");
    jest.spyOn(service, "listPublicClasses").mockResolvedValue({
      items: [] as never[],
      total: 45,
      page: 2,
      limit: 20,
      totalPages: 3,
    });
    jest.spyOn(service, "listPublicBusinessClasses").mockResolvedValue({
      items: [] as never[],
      total: 21,
      page: 2,
      limit: 20,
      totalPages: 2,
    });
    await expect(
      service.searchPublicCatalog({ q: "یوگا", kind: "class", page: "2" }),
    ).resolves.toMatchObject({
      total: 66,
      page: 2,
      totalPages: 3,
      businessClasses: [],
    });
    expect(service.listPublicClasses).toHaveBeenCalledWith(
      expect.objectContaining({ page: "2" }),
    );
    expect(service.listPublicBusinessClasses).toHaveBeenCalledWith(
      expect.objectContaining({ page: "2" }),
    );
    expect(coaches).not.toHaveBeenCalled();
  });
  it("propagates a failed source instead of claiming no matches", async () => {
    const { service } = setup();
    jest
      .spyOn(service, "listPublicClasses")
      .mockRejectedValue(new Error("unavailable"));
    jest.spyOn(service, "listPublicBusinessClasses").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    await expect(
      service.searchPublicCatalog({ kind: "class" }),
    ).rejects.toThrow("unavailable");
  });
});
