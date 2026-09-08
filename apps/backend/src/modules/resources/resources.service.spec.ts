import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Connection } from "mongoose";

import { resourceSeedData } from "./resources.seed-data";
import { ResourcesService } from "./resources.service";

describe("ResourcesService", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let service: ResourcesService;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await mongoose.createConnection(mongo.getUri()).asPromise();
    service = new ResourcesService(connection);
    await service.list("location", "country", {});
    await Promise.all(
      Object.values(connection.models).map((model) => model.syncIndexes()),
    );
  });

  afterAll(async () => {
    await connection.close();
    await mongo.stop();
  });

  afterEach(async () => {
    await Promise.all(
      Object.values(connection.collections).map((collection) =>
        collection.deleteMany({}),
      ),
    );
  });

  it("counts only discoverable clubs for each public province", async () => {
    const country = await service.create("location", "country", {
      name: "ایران",
      code: "IR",
    });
    const province = await service.create("location", "province", {
      name: "تهران",
      code: "TEHRAN",
      countryId: String(country.id),
    });
    const base = {
      geo: { provinceId: new mongoose.Types.ObjectId(String(province.id)) },
      reviewStatus: "approved",
      visibility: "public",
      operationalStatus: "active",
    };
    await connection
      .collection("clubs")
      .insertMany([
        base,
        { ...base, geo: { provinceId: String(province.id) } },
        { ...base, visibility: "private" },
        { ...base, reviewStatus: "pending" },
        { ...base, operationalStatus: "permanently_closed" },
        { ...base, qualityStatus: "suspended" },
      ]);
    const result = await service.listPublic("location", "province", {});
    expect(result.items[0]).toMatchObject({
      id: String(province.id),
      clubsCount: 2,
    });
  });

  it("supports generic CRUD, filtering, searching, sorting and pagination", async () => {
    const first = await service.create("location", "country", {
      name: "ایران",
      code: "ir",
      sortOrder: 2,
    });
    await service.create("location", "country", {
      name: "ترکیه",
      code: "tr",
      sortOrder: 1,
      isActive: false,
    });

    const active = await service.list("location", "country", {
      isActive: "true",
      search: "ایران",
      page: "1",
      limit: "1",
      sortBy: "sortOrder",
      sortDirection: "asc",
    });
    expect(active).toMatchObject({
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1,
    });
    expect(active.items[0]).toMatchObject({
      id: first.id,
      code: "IR",
      isActive: true,
    });

    const byId = await service.list("location", "country", {
      search: String(first.id),
    });
    expect(byId.total).toBe(1);
    expect(byId.items[0]?.id).toBe(first.id);

    const updated = await service.update(
      "location",
      "country",
      String(first.id),
      { description: "کشور محل فعالیت" },
    );
    expect(updated.description).toBe("کشور محل فعالیت");
    await expect(
      service.update("location", "country", String(first.id), {
        code: "OTHER",
      }),
    ).rejects.toMatchObject({ code: "RESOURCE_CODE_IMMUTABLE" });
    await expect(
      service.delete("location", "country", String(first.id)),
    ).resolves.toEqual({ success: true });
  });

  it("rejects duplicate names after Persian character and whitespace normalization", async () => {
    await service.create("location", "country", {
      name: "ايران  اسلامی",
      code: "IR",
    });
    await expect(
      service.create("location", "country", {
        name: "ایران اسلامی",
        code: "IRAN",
      }),
    ).rejects.toMatchObject({ status: 409, code: "RESOURCE_NAME_TAKEN" });
  });

  it("enforces active hierarchy relations and prevents deleting a used parent", async () => {
    const country = await service.create("location", "country", {
      name: "ایران",
      code: "IR",
    });
    await service.update("location", "country", String(country.id), {
      isActive: false,
    });
    await expect(
      service.create("location", "province", {
        name: "تهران",
        code: "THR",
        countryId: String(country.id),
      }),
    ).rejects.toMatchObject({ code: "RESOURCE_RELATION_INACTIVE" });

    await service.update("location", "country", String(country.id), {
      isActive: true,
    });
    const province = await service.create("location", "province", {
      name: "تهران",
      code: "THR",
      countryId: String(country.id),
    });
    await expect(
      service.delete("location", "country", String(country.id)),
    ).rejects.toMatchObject({ status: 409, code: "RESOURCE_IN_USE" });
    await service.update("location", "country", String(country.id), {
      isActive: false,
    });
    expect(
      (await service.get("location", "province", String(province.id)))
        .countryId,
    ).toBe(String(country.id));
  });

  it("validates and stores a specialized age-group resource", async () => {
    await expect(
      service.create("classes", "age-group", {
        name: "نوجوان",
        minAge: 17,
        maxAge: 12,
      }),
    ).rejects.toMatchObject({ code: "INVALID_AGE_RANGE" });
    const created = await service.create("classes", "age-group", {
      name: "نوجوان",
      minAge: 12,
      maxAge: 17,
    });
    expect(created).toMatchObject({
      name: "نوجوان",
      minAge: 12,
      maxAge: 17,
      isActive: true,
    });
  });

  it("seeds equipment with its category and sport dependencies idempotently", async () => {
    const first = await service.seed("facilities", "equipment");
    const equipmentCount = resourceSeedData.equipment?.length ?? 0;
    expect(first.created).toBe(equipmentCount);
    expect(first.dependenciesCreated).toBeGreaterThan(0);
    expect((await service.list("facilities", "equipment", {})).total).toBe(
      equipmentCount,
    );

    const second = await service.seed("facilities", "equipment");
    expect(second.created).toBe(0);
    expect(second.existing).toBe(equipmentCount);
    expect((await service.list("facilities", "equipment", {})).total).toBe(
      equipmentCount,
    );
  });

  it("seeds Persian club tags idempotently and allows tags without a code", async () => {
    const first = await service.seed("clubs", "tag");
    const tagCount = resourceSeedData.club_tags?.length ?? 0;

    expect(first.created).toBe(tagCount);
    expect(
      (await service.list("clubs", "tag", { search: "بدنسازی" })).items[0],
    ).toMatchObject({ name: "بدنسازی", code: "BODYBUILDING" });

    const custom = await service.create("clubs", "tag", {
      name: "تمرین صبحگاهی",
    });
    expect(custom).toMatchObject({
      name: "تمرین صبحگاهی",
      isActive: true,
    });

    const second = await service.seed("clubs", "tag");
    expect(second.created).toBe(0);
    expect(second.existing).toBe(tagCount);
  });

  it("seeds the expanded location hierarchy and local city artwork", async () => {
    await service.seed("location", "neighborhood");

    expect(
      (await service.list("location", "country", { search: "ایران" })).total,
    ).toBe(1);
    expect(
      (await service.list("location", "province", { search: "تهران" })).total,
    ).toBe(1);
    expect((await service.list("location", "city", {})).total).toBe(
      resourceSeedData.cities?.length ?? 0,
    );
    expect((await service.list("location", "district", {})).total).toBe(
      resourceSeedData.districts?.length ?? 0,
    );
    expect((await service.list("location", "neighborhood", {})).total).toBe(
      resourceSeedData.neighborhoods?.length ?? 0,
    );
    expect(
      (await service.list("location", "city", { search: "تهران" })).items[0],
    ).toMatchObject({
      slug: "tehran",
      imageUrl: "/discovery/locations/city-modern.jpg",
    });
  });

  it("backfills missing seed details without replacing managed content", async () => {
    await service.seed("location", "province");
    const province = (
      await service.list("location", "province", { search: "تهران" })
    ).items[0];
    expect(province).toBeDefined();
    if (!province) throw new Error("Tehran province seed is missing");
    await service.create("location", "city", {
      name: "تهران اختصاصی",
      code: "TEHRAN_CITY",
      provinceId: String(province.id),
      description: "توضیح سفارشی مدیر",
    });

    await service.seed("location", "city");

    const city = (
      await service.list("location", "city", { search: "تهران اختصاصی" })
    ).items[0];
    expect(city).toMatchObject({
      name: "تهران اختصاصی",
      description: "توضیح سفارشی مدیر",
      imageUrl: "/discovery/locations/city-modern.jpg",
    });
  });

  it("accepts safe project-local image URLs and rejects unsafe schemes", async () => {
    await expect(
      service.create("location", "country", {
        name: "کشور آزمایشی",
        code: "TEST_COUNTRY",
        imageUrl: "/discovery/locations/city-modern.jpg",
      }),
    ).resolves.toMatchObject({
      imageUrl: "/discovery/locations/city-modern.jpg",
    });
    await expect(
      service.create("location", "country", {
        name: "کشور ناامن",
        code: "UNSAFE_COUNTRY",
        imageUrl: "javascript:alert(1)",
      }),
    ).rejects.toMatchObject({ code: "INVALID_URL" });
  });

  it("seeds a practical set of cancellation reasons idempotently", async () => {
    const first = await service.seed("commerce", "cancellation-reason");
    const second = await service.seed("commerce", "cancellation-reason");
    const cancellationReasonCount =
      resourceSeedData.cancellation_reasons?.length ?? 0;

    expect(first.created).toBe(cancellationReasonCount);
    expect(first.created).toBeGreaterThanOrEqual(12);
    expect(second.created).toBe(0);
    expect(second.existing).toBe(cancellationReasonCount);
  });

  it("creates sample published articles when article categories are seeded", async () => {
    const first = await service.seed("content", "article-category");
    const second = await service.seed("content", "article-category");

    expect(first.articlesCreated).toBe(3);
    expect(second.articlesCreated).toBe(0);
    expect(await connection.collection("articles").countDocuments()).toBe(3);
  });
});
