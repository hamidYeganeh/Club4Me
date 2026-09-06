import "reflect-metadata";
import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Connection } from "mongoose";
import request from "supertest";
import { GlobalExceptionFilter } from "../../common/filters/global-exception.filter";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ResourceAccessGuard } from "./resource-access.guard";
import {
  resourceControllers,
  ResourceRegistryController,
} from "./resource.controllers";
import { resourcePath, serverResourceDefinitions } from "./resources.registry";
import { resourceSeedData } from "./resources.seed-data";
import { ResourcesService } from "./resources.service";

describe("Domain resource HTTP APIs", () => {
  jest.setTimeout(120_000);
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let app: INestApplication;
  const admin = { Authorization: "Bearer test-admin" };
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await mongoose.createConnection(mongo.getUri()).asPromise();
    const module = await Test.createTestingModule({
      controllers: [...resourceControllers, ResourceRegistryController],
      providers: [
        ResourceAccessGuard,
        {
          provide: ResourcesService,
          useValue: new ResourcesService(connection),
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate(context: ExecutionContext) {
              const req = context.switchToHttp().getRequest();
              if (!req.headers.authorization) throw new UnauthorizedException();
              req.user = {
                roles:
                  req.headers.authorization === admin.Authorization
                    ? ["admin"]
                    : ["business_owner"],
              };
              return true;
            },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    await connection?.close();
    await mongo?.stop();
  });

  it("registers unique concrete endpoints for every domain and seeds all resources idempotently", async () => {
    expect(new Set(serverResourceDefinitions.map(resourcePath)).size).toBe(
      serverResourceDefinitions.length,
    );
    expect(
      new Set(
        serverResourceDefinitions.map(
          (item) => resourcePath(item).split("/")[0],
        ),
      ).size,
    ).toBe(9);
    const first = await request(app.getHttpServer())
      .post("/api/v1/resources/registry?action=seed")
      .set(admin)
      .expect(201);
    expect(first.body.created).toBeGreaterThan(500);
    for (const definition of serverResourceDefinitions) {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/${resourcePath(definition)}`)
        .set(admin)
        .query({ limit: 1 })
        .expect(200);
      expect(response.body.total).toBe(
        resourceSeedData[definition.key]?.length ?? 0,
      );
      expect(response.body.total).toBeGreaterThan(0);
    }
    const second = await request(app.getHttpServer())
      .post("/api/v1/resources/registry?action=seed")
      .set(admin)
      .expect(201);
    expect(second.body.created).toBe(0);
    expect(second.body.existing).toBe(first.body.created);
    expect(await connection.collection("articles").countDocuments()).toBe(0);
    expect(await connection.collection("provinces").countDocuments()).toBe(31);
  });

  it("restricts management to admins and exposes only active options", async () => {
    const url = "/api/v1/facilities/roof_types";
    await request(app.getHttpServer()).get(url).expect(401);
    await request(app.getHttpServer())
      .post(url)
      .set({ Authorization: "Bearer owner" })
      .send({ name: "forbidden" })
      .expect(403);
    await request(app.getHttpServer())
      .get("/api/v1/moderation/suspension_reasons?action=options")
      .expect(401);
    const created = await request(app.getHttpServer())
      .post(`${url}?action=create`)
      .set(admin)
      .send({ name: "سقف آزمایشی", aliases: ["پوشش ويژه"], code: "TEST_ROOF" })
      .expect(201);
    const id = created.body.id;
    await request(app.getHttpServer())
      .get(`${url}/${id}`)
      .set(admin)
      .expect(200);
    const search = await request(app.getHttpServer())
      .get(url)
      .set(admin)
      .query({ q: "پوشش ویژه", page: 1, limit: 1 })
      .expect(200);
    expect(search.body.items[0].id).toBe(id);
    expect(search.body.total).toBe(1);
    await request(app.getHttpServer())
      .patch(`${url}/${id}?action=deactivate`)
      .set(admin)
      .expect(200);
    await request(app.getHttpServer())
      .get(`${url}/${id}?action=options`)
      .expect(404);
    const options = await request(app.getHttpServer())
      .get(url)
      .query({ action: "options", isActive: false, search: "سقف آزمایشی" })
      .expect(200);
    expect(options.body.total).toBe(0);
    await request(app.getHttpServer())
      .patch(`${url}/${id}?action=activate`)
      .set(admin)
      .expect(200);
    await request(app.getHttpServer())
      .get(`${url}/${id}?action=options`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`${url}/${id}`)
      .set(admin)
      .send({ name: "سقف ویرایش‌شده" })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`${url}/${id}?action=delete`)
      .set(admin)
      .expect(200);
    await request(app.getHttpServer())
      .get(`${url}/${id}`)
      .set(admin)
      .expect(404);
  });

  it("rejects malformed values, duplicate query parameters and incorrect actions", async () => {
    const url = "/api/v1/facilities/roof_types";
    await request(app.getHttpServer())
      .post(url)
      .set(admin)
      .send({ name: "نام", isActive: "false" })
      .expect(400);
    await request(app.getHttpServer())
      .get(`${url}?search=a&search=b`)
      .set(admin)
      .expect(400);
    await request(app.getHttpServer())
      .get(`${url}?action=delete`)
      .set(admin)
      .expect(400);
    await request(app.getHttpServer())
      .post(`${url}?action=activate`)
      .set(admin)
      .send({ name: "نام" })
      .expect(400);
    await request(app.getHttpServer())
      .get(`${url}?page=0`)
      .set(admin)
      .expect(400);
  });
});
