import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Media, MediaSchema } from "./schemas/media.schema";
import { Coach, CoachSchema } from "../coaching/schemas/coaching.schemas";
import { MediaService } from "./media.service";
import { MediaStorageService } from "./media-storage.service";

describe("private credential media", () => {
  let mongo: MongoMemoryServer, db: Connection, service: MediaService;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    const model = db.model(Media.name, MediaSchema);
    db.model(Coach.name, CoachSchema);
    service = new MediaService(
      model as never,
      new MediaStorageService({
        env: {
          JWT_SECRET: "private-media-test-secret",
          MEDIA_PUBLIC_BASE_URL: "https://example.test",
          MEDIA_LOCAL_DIR: "/tmp/club4me-private-test",
        },
      } as never),
    );
    await Promise.all(Object.values(db.models).map((model) => model.init()));
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  it("protects legacy credentials, excludes them from public media and keeps them private after removal", async () => {
    const ownerId = new Types.ObjectId();
    const item = await db.model(Media.name).create({
      ownerId,
      url: "https://example.test/file",
      storageKey: "12345678-1234-1234-1234-123456789abc",
      mimeType: "image/png",
      hash: "private-credential",
      byteSize: 12,
    });
    const coach = await db.model(Coach.name).create({
      userId: ownerId,
      slug: "private-credential-coach",
      professionalProfile: {
        credentials: [
          { title: "مدرک", issuer: "فدراسیون", mediaId: String(item._id) },
        ],
      },
    });
    await expect(service.getFile(String(item._id))).rejects.toMatchObject({
      code: "MEDIA_NOT_FOUND",
    });
    expect(await service.getReadyByIds([String(item._id)])).toEqual([]);
    expect(
      (await service.list(String(new Types.ObjectId()), String(item._id)))
        .items,
    ).toEqual([]);
    const owned = (await service.list(String(ownerId), String(item._id)))
      .items[0]!;
    const url = new URL(owned.url);
    expect(url.searchParams.get("signature")).toHaveLength(64);
    expect(
      (
        await service.getFile(
          String(item._id),
          url.searchParams.get("expires")!,
          url.searchParams.get("signature")!,
        )
      ).isPrivate,
    ).toBe(true);
    await db
      .model(Coach.name)
      .updateOne(
        { _id: coach._id },
        { $set: { "professionalProfile.credentials": [] } },
      );
    await expect(service.getFile(String(item._id))).rejects.toMatchObject({
      code: "MEDIA_NOT_FOUND",
    });
    expect(
      (await service.getReadyForReview([String(item._id)]))[0]!.url,
    ).toContain("signature=");
  });
  it("rejects promoting another user's media or an external URL into a private uploaded document", async () => {
    const ownerId = new Types.ObjectId();
    const item = await db.model(Media.name).create({
      ownerId,
      url: "https://external.test/file",
      mimeType: "image/png",
      hash: "external-credential",
      byteSize: 12,
    });
    await expect(
      service.makePrivate(String(new Types.ObjectId()), [String(item._id)]),
    ).rejects.toMatchObject({ code: "MEDIA_NOT_FOUND" });
    await expect(
      service.makePrivate(String(ownerId), [String(item._id)]),
    ).rejects.toMatchObject({ code: "PRIVATE_MEDIA_REQUIRES_UPLOAD" });
  });
});
