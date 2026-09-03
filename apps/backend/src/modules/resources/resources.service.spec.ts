import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Connection } from "mongoose";

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
    expect(first.created).toBeGreaterThanOrEqual(6);
    expect(first.dependenciesCreated).toBeGreaterThan(0);
    expect((await service.list("facilities", "equipment", {})).total).toBe(6);

    const second = await service.seed("facilities", "equipment");
    expect(second.created).toBe(0);
    expect(second.existing).toBe(6);
    expect((await service.list("facilities", "equipment", {})).total).toBe(6);
  });

  it("seeds Iran, Tehran and its districts and neighborhoods through dependencies", async () => {
    await service.seed("location", "neighborhood");

    expect(
      (await service.list("location", "country", { search: "ایران" })).total,
    ).toBe(1);
    expect(
      (await service.list("location", "province", { search: "تهران" })).total,
    ).toBe(1);
    expect(
      (await service.list("location", "city", { search: "تهران" })).total,
    ).toBe(1);
    expect((await service.list("location", "district", {})).total).toBe(5);
    expect((await service.list("location", "neighborhood", {})).total).toBe(7);
  });

  it("creates sample published articles when article categories are seeded", async () => {
    const first = await service.seed("content", "article-category");
    const second = await service.seed("content", "article-category");

    expect(first.articlesCreated).toBe(3);
    expect(second.articlesCreated).toBe(0);
    expect(await connection.collection("articles").countDocuments()).toBe(3);
  });
});
