import { DiscoveryFeedService } from "./discovery.service";

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
});
