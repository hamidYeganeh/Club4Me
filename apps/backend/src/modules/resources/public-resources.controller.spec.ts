import { PublicResourcesController } from "./public-resources.controller";

describe("PublicResourcesController", () => {
  it("exposes active report reasons through the public catalog", async () => {
    const list = jest.fn().mockResolvedValue({ items: [] });
    const controller = new PublicResourcesController({ list } as never);

    await controller.list("moderation", "report-reason", { limit: "100" });

    expect(list).toHaveBeenCalledWith("moderation", "report-reason", {
      limit: "100",
      isActive: "true",
    });
  });

  it("exposes active discovery search keywords through the public catalog", async () => {
    const list = jest.fn().mockResolvedValue({ items: [] });
    const controller = new PublicResourcesController({ list } as never);

    await controller.list("discovery", "search-keyword", { limit: "8" });

    expect(list).toHaveBeenCalledWith("discovery", "search-keyword", {
      limit: "8",
      isActive: "true",
    });
  });

  it("still rejects resources that are not explicitly public", () => {
    const controller = new PublicResourcesController({
      list: jest.fn(),
    } as never);

    expect(() =>
      controller.list("moderation", "suspension-reason", {}),
    ).toThrow("Resource type not found");
  });
});
