import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { corsOriginFor, corsOptionsFor } from "./cors";

@Controller("cors-probe")
class CorsProbeController {
  @Get()
  probe() {
    return { ok: true };
  }
}

@Module({ controllers: [CorsProbeController] })
class CorsProbeModule {}

async function createCorsProbe(
  NODE_ENV: "development" | "production" | "test",
): Promise<INestApplication> {
  const app = await NestFactory.create(CorsProbeModule, { logger: false });
  app.enableCors(
    corsOptionsFor({
      NODE_ENV,
      CORS_ORIGINS: ["https://app.gym4me.ir"],
    }),
  );
  await app.init();
  return app;
}

describe("CORS policy", () => {
  it.each(["development", "test", "production"] as const)(
    "reflects arbitrary %s origins",
    (NODE_ENV) => {
      expect(
        corsOriginFor({ NODE_ENV, CORS_ORIGINS: ["http://localhost:7081"] }),
      ).toBe(true);
    },
  );

  it("uses reflection instead of an invalid credentialed wildcard", () => {
    const options = corsOptionsFor({
      NODE_ENV: "production",
      CORS_ORIGINS: ["https://app.gym4me.ir"],
    });

    expect(options).toMatchObject({
      credentials: true,
      origin: true,
    });
    expect(options.origin).not.toBe("*");
  });

  it("answers a debug-device preflight with reflected CORS headers", async () => {
    const app = await createCorsProbe("development");
    try {
      const origin = "http://192.168.1.42:5173";
      const response = await request(app.getHttpServer())
        .options("/cors-probe")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "GET")
        .set("Access-Control-Request-Headers", "x-debug-client")
        .expect(204);

      expect(response.headers["access-control-allow-origin"]).toBe(origin);
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
      expect(response.headers["access-control-allow-headers"]).toBe(
        "x-debug-client",
      );
    } finally {
      await app.close();
    }
  });

  it("answers an arbitrary production preflight", async () => {
    const app = await createCorsProbe("production");
    try {
      const response = await request(app.getHttpServer())
        .options("/cors-probe")
        .set("Origin", "https://unlisted-client.example")
        .set("Access-Control-Request-Method", "GET")
        .expect(204);

      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://unlisted-client.example",
      );
    } finally {
      await app.close();
    }
  });
});
