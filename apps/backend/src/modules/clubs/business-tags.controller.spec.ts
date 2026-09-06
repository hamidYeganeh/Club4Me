import { ResourcesService } from "../resources/resources.service";
import { BusinessTagsController } from "./business-tags.controller";
import { CreateClubTagDto } from "./dto/create-club-tag.dto";

describe("BusinessTagsController", () => {
  const resources = {
    list: jest.fn(),
    create: jest.fn(),
  };
  const controller = new BusinessTagsController(
    resources as unknown as ResourcesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it("lists only active tags with a business-friendly default limit", async () => {
    resources.list.mockResolvedValue({ items: [], total: 0 });

    await controller.list({ search: "یوگا" });

    expect(resources.list).toHaveBeenCalledWith("clubs", "tag", {
      search: "یوگا",
      isActive: "true",
      limit: "100",
    });
  });

  it("returns an existing normalized Persian tag instead of duplicating it", async () => {
    const existing = { id: "tag-1", name: "باشگاه بانوان" };
    resources.list.mockResolvedValue({ items: [existing] });

    await expect(
      controller.create({ name: "باشگاه  بانوان" }),
    ).resolves.toEqual(existing);
    expect(resources.create).not.toHaveBeenCalled();
  });

  it("creates a new tag and validates the public request shape", async () => {
    const created = { id: "tag-2", name: "تمرین صبحگاهی" };
    resources.list.mockResolvedValue({ items: [] });
    resources.create.mockResolvedValue(created);

    await expect(controller.create({ name: "تمرین صبحگاهی" })).resolves.toEqual(
      created,
    );
    expect(resources.create).toHaveBeenCalledWith("clubs", "tag", {
      name: "تمرین صبحگاهی",
    });
    expect(CreateClubTagDto.schema.safeParse({ name: "" }).success).toBe(false);
    expect(
      CreateClubTagDto.schema.safeParse({ name: "تگ", unknown: true }).success,
    ).toBe(false);
  });
});
