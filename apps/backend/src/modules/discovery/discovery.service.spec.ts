import { DiscoveryFeedService } from "./discovery.service";
import { DEFAULT_DISCOVERY_SECTIONS } from "./discovery-section.defaults";

describe("DiscoveryFeedService", () => {
  it("keeps configured sections in the public feed when they have no items", async () => {
    const emptyBannerSection = {
      _id: "section-1",
      key: "empty-banner-section",
      type: "banners",
      position: 0,
      title: "بخش خالی",
      subtitle: "",
      layout: "carousel",
      viewAllLabel: "",
      viewAllUrl: "",
      appearance: {},
      banners: [],
    };
    const sections = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([emptyBannerSection]),
        }),
      }),
    };
    const service = new DiscoveryFeedService(
      sections as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.getFeed()).resolves.toEqual([
      expect.objectContaining({
        id: "section-1",
        key: "empty-banner-section",
        items: [],
      }),
    ]);
  });

  it("imports only missing default sections and appends them", async () => {
    const missingCount = DEFAULT_DISCOVERY_SECTIONS.length - 1;
    const sections = {
      distinct: jest.fn().mockResolvedValue(["featured-banners"]),
      countDocuments: jest.fn().mockResolvedValue(2),
      bulkWrite: jest.fn().mockResolvedValue({ upsertedCount: missingCount }),
    };
    const service = new DiscoveryFeedService(
      sections as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.importDefaults(["admin"])).resolves.toEqual({
      created: missingCount,
      existing: 1,
    });
    expect(sections.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { key: "top-rated-clubs" },
            update: {
              $setOnInsert: expect.objectContaining({ position: 2 }),
            },
            upsert: true,
          }),
        }),
      ]),
    );
    expect(sections.bulkWrite.mock.calls[0]?.[0]).toHaveLength(missingCount);
  });

  it("does not rewrite defaults that already exist", async () => {
    const sections = {
      distinct: jest
        .fn()
        .mockResolvedValue(DEFAULT_DISCOVERY_SECTIONS.map(({ key }) => key)),
      countDocuments: jest.fn(),
      bulkWrite: jest.fn(),
    };
    const service = new DiscoveryFeedService(
      sections as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.importDefaults(["admin"])).resolves.toEqual({
      created: 0,
      existing: DEFAULT_DISCOVERY_SECTIONS.length,
    });
    expect(sections.countDocuments).not.toHaveBeenCalled();
    expect(sections.bulkWrite).not.toHaveBeenCalled();
  });

  it("resolves a sport section from its configured category", async () => {
    const sportSection = {
      _id: "section-sports",
      key: "ball-sports",
      type: "sports",
      position: 0,
      title: "ورزش‌های توپی",
      subtitle: "",
      layout: "carousel",
      viewAllLabel: "مشاهده همه",
      viewAllUrl: "/discovery/search",
      appearance: {},
      banners: [],
      selection: {
        mode: "query",
        itemIds: [],
        limit: 10,
        sort: "name",
        filters: { categoryCodes: ["BALL_SPORTS"] },
      },
    };
    const sections = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([sportSection]),
        }),
      }),
    };
    const resources = {
      list: jest.fn().mockImplementation((_: string, segment: string) =>
        segment === "sport-category"
          ? Promise.resolve({
              items: [
                {
                  id: "category-1",
                  name: "ورزش‌های توپی",
                  code: "BALL_SPORTS",
                },
              ],
            })
          : Promise.resolve({
              items: [
                {
                  id: "sport-1",
                  name: "والیبال",
                  slug: "volleyball",
                  categoryId: "category-1",
                  isActive: true,
                },
              ],
            }),
      ),
    };
    const media = { getReadyByIds: jest.fn().mockResolvedValue([]) };
    const service = new DiscoveryFeedService(
      sections as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      media as never,
      resources as never,
    );

    await expect(service.getFeed()).resolves.toEqual([
      expect.objectContaining({
        type: "sports",
        items: [
          expect.objectContaining({
            name: "والیبال",
            categoryName: "ورزش‌های توپی",
          }),
        ],
      }),
    ]);
    expect(resources.list).toHaveBeenCalledWith("sports", "sport", {
      isActive: "true",
      parentId: "category-1",
      limit: "100",
    });
  });
});
