import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import type { INestApplication } from "@nestjs/common";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { AppConfigService } from "../../config/app-config.service";
import { GlobalExceptionFilter } from "../../common/filters/global-exception.filter";
import { ApiResponseInterceptor } from "../../common/interceptors/api-response.interceptor";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MediaController } from "./media.controller";
import { MediaFileController } from "./media-file.controller";
import { MediaService } from "./media.service";
import { MediaStorageService } from "./media-storage.service";
import { Media } from "./schemas/media.schema";
import { MAX_MEDIA_BYTES } from "./media.constants";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0N8AAAAASUVORK5CYII=",
  "base64",
);
const ownerId = "507f1f77bcf86cd799439011";

describe("media upload and delivery", () => {
  let app: INestApplication;
  let directory: string;
  let records: any[];
  let model: { findOne: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), ".club-media-"));
    records = [];
    model = {
      findOne: jest.fn((filter) => ({
        exec: async () =>
          records.find((record) =>
            Object.entries(filter).every(
              ([key, value]) => String(record[key]) === String(value),
            ),
          ),
      })),
      create: jest.fn(async (record) => {
        const saved = { ...record, createdAt: new Date() };
        records.push(saved);
        return saved;
      }),
    };
    const module = await Test.createTestingModule({
      controllers: [MediaController, MediaFileController],
      providers: [
        MediaService,
        MediaStorageService,
        { provide: getModelToken(Media.name), useValue: model },
        {
          provide: AppConfigService,
          useValue: {
            env: {
              MEDIA_LOCAL_DIR: directory,
              MEDIA_PUBLIC_BASE_URL: "https://api.example.com",
              JWT_SECRET: "test-private-media-signing-secret",
            },
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: ownerId };
          return req.headers.authorization === "Bearer test";
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  });

  const upload = () =>
    request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", "Bearer test")
      .attach("file", png, { filename: "photo.png", contentType: "image/png" });

  it("serves bytes from a hidden storage root with range support", async () => {
    const result = await upload().expect(201);
    expect(result.body.data.url).toBe(
      `https://api.example.com/media/${records[0]._id}/file`,
    );
    expect(JSON.stringify(records)).not.toContain("base64");
    expect(await readFile(join(directory, records[0].storageKey))).toEqual(png);
    const path = new URL(result.body.data.url).pathname;
    const file = await request(app.getHttpServer())
      .get(path)
      .expect(200)
      .expect("Content-Type", /image\/png/);
    expect(file.body).toEqual(png);
    expect(file.headers["cross-origin-resource-policy"]).toBe("cross-origin");
    await request(app.getHttpServer())
      .get(path)
      .set("Range", "bytes=0-7")
      .expect(206)
      .expect("Content-Range", `bytes 0-7/${png.length}`);
    records[0].status = "blocked";
    await request(app.getHttpServer()).get(path).expect(404);
  });

  it("deduplicates uploads for the same owner without extra files", async () => {
    const first = await upload().expect(201);
    const second = await upload().expect(201);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(await readdir(directory)).toHaveLength(1);
  });

  it("serves private files only with a short-lived signed URL and never caches them publicly", async () => {
    const uploaded = await request(app.getHttpServer())
      .post("/api/v1/media/private/upload")
      .set("Authorization", "Bearer test")
      .attach("file", png, "credential.png")
      .expect(201);
    expect(uploaded.body.data.url).toContain("signature=");
    expect(records[0].isPrivate).toBe(true);
    const storage = app.get(MediaStorageService);
    const id = String(records[0]._id);
    await request(app.getHttpServer()).get(`/media/${id}/file`).expect(404);
    const url = new URL(storage.privateUrl(id));
    await request(app.getHttpServer())
      .get(url.pathname + url.search)
      .expect(200)
      .expect("Cache-Control", "private, no-store");
    url.searchParams.set("signature", "0".repeat(64));
    await request(app.getHttpServer())
      .get(url.pathname + url.search)
      .expect(404);
    const expired = new URL(storage.privateUrl(id));
    expired.searchParams.set("expires", String(Date.now() - 1));
    await request(app.getHttpServer())
      .get(expired.pathname + expired.search)
      .expect(404);
    const otherFile = new URL(storage.privateUrl("507f1f77bcf86cd799439099"));
    await request(app.getHttpServer())
      .get(url.pathname + otherFile.search)
      .expect(404);
  });

  it("requires authentication and rejects missing, oversized, or disguised files", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .attach("file", png, "photo.png")
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", "Bearer test")
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", "Bearer test")
      .attach("file", Buffer.from("<script>alert(1)</script>"), {
        filename: "image.png",
        contentType: "image/png",
      })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/media/upload")
      .set("Authorization", "Bearer test")
      .attach("file", Buffer.alloc(MAX_MEDIA_BYTES + 1), "image.png")
      .expect(413);
    expect(await readdir(directory)).toHaveLength(0);
  });

  it("converts legacy client base64 requests before persistence", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/media")
      .set("Authorization", "Bearer test")
      .send({
        url: `data:image/png;base64,${png.toString("base64")}`,
        mimeType: "image/png",
      })
      .expect(201);
    expect(records[0].url).toMatch(/^https:/);
    expect(await readdir(directory)).toHaveLength(1);
  });

  it("moves an existing inline media record to disk while preserving its ID", async () => {
    const { createHash } = await import("node:crypto");
    const record = {
      _id: "507f1f77bcf86cd799439012",
      ownerId,
      status: "ready",
      hash: createHash("sha256").update(png).digest("hex"),
      url: `data:image/png;base64,${png.toString("base64")}`,
      mimeType: "image/png",
      byteSize: png.length,
      createdAt: new Date(),
    };
    records.push(record);
    Object.assign(model, {
      updateOne: jest.fn((_filter, update) => ({
        exec: async () => {
          Object.assign(record, update.$set);
          return { modifiedCount: 1 };
        },
      })),
    });
    const result = await upload().expect(201);
    expect(result.body.data.id).toBe(record._id);
    expect(record.url).toMatch(/^https:/);
    expect(await readdir(directory)).toHaveLength(1);
    await request(app.getHttpServer())
      .get(`/media/${record._id}/file`)
      .expect(200);
  });

  it("cleans up the file if database persistence fails", async () => {
    model.create.mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(
      app
        .get(MediaService)
        .upload(ownerId, { buffer: png, mimetype: "image/png" }),
    ).rejects.toThrow("Database unavailable");
    expect(await readdir(directory)).toHaveLength(0);
  });
});
