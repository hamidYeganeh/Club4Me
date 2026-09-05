import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import type { App } from "supertest/types";

import { AppModule } from "../src/app.module";
import { InMemoryRedis } from "../src/infrastructure/redis/in-memory-redis";
import { REDIS_CLIENT } from "../src/infrastructure/redis/redis.types";

describe("App bootstrap and health e2e", () => {
  jest.setTimeout(60_000);

  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let previousMongoUrl: string | undefined;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    previousMongoUrl = process.env.MONGODB_URL;
    process.env.MONGODB_URL = mongo.getUri();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(REDIS_CLIENT)
      .useValue(new InMemoryRedis())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();

    if (previousMongoUrl === undefined) {
      delete process.env.MONGODB_URL;
    } else {
      process.env.MONGODB_URL = previousMongoUrl;
    }
  });

  it("boots the complete dependency graph and reports liveness", async () => {
    const response = await request(app.getHttpServer() as App)
      .get("/health/live")
      .expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
    });
    expect(response.body.uptimeSeconds).toEqual(expect.any(Number));
  });

  it("reports MongoDB and Redis readiness", async () => {
    await request(app.getHttpServer() as App)
      .get("/health/ready")
      .expect(200)
      .expect({
        status: "ok",
        mongo: "connected",
        redis: "connected",
      });
  });
});
