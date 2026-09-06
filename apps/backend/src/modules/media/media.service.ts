import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { createHash } from "node:crypto";

import { AppError } from "../../common/errors/app.exception";
import type { CreateMediaDto } from "./dto/create-media.dto";
import { MediaStorageService } from "./media-storage.service";
import { MAX_MEDIA_BYTES } from "./media.constants";
import { Media, type MediaDocument } from "./schemas/media.schema";

export type PublicMedia = {
  id: string;
  hash: string;
  url: string;
  mimeType: string;
  byteSize: number;
  status: "ready" | "blocked";
  createdAt: string;
};

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name) private readonly model: Model<MediaDocument>,
    private readonly storage: MediaStorageService,
  ) {}

  async create(ownerId: string, input: CreateMediaDto): Promise<PublicMedia> {
    if (input.url.trim().startsWith("data:")) {
      const match = /^data:([^;,]+);base64,([a-z0-9+/]+={0,2})$/i.exec(
        input.url.trim(),
      );
      if (!match || match[1]!.toLowerCase() !== input.mimeType.toLowerCase()) {
        throw new AppError(400, "INVALID_MEDIA", "Invalid media payload");
      }
      return this.upload(ownerId, {
        buffer: Buffer.from(match[2]!, "base64"),
        mimetype: input.mimeType,
      });
    }
    const ownerObjectId = toObjectId(ownerId);
    const stored = prepareMedia(input.url, input.mimeType);
    const existing = await this.model
      .findOne({ ownerId: ownerObjectId, hash: stored.hash })
      .exec();
    if (existing) return this.serialize(existing);

    try {
      const media = await this.model.create({
        ownerId: ownerObjectId,
        ...stored,
        status: "ready",
      });
      return toPublic(media);
    } catch (error) {
      // Concurrent uploads of the same content can race on the unique index.
      if ((error as { code?: number }).code !== 11000) throw error;
      const duplicate = await this.model
        .findOne({ ownerId: ownerObjectId, hash: stored.hash })
        .exec();
      if (!duplicate) throw error;
      return this.serialize(duplicate);
    }
  }

  async upload(
    ownerId: string,
    file?: { buffer: Buffer; mimetype: string },
  ): Promise<PublicMedia> {
    const ownerObjectId = toObjectId(ownerId);
    if (!file?.buffer?.length || file.buffer.length > MAX_MEDIA_BYTES) {
      throw new AppError(
        400,
        "INVALID_MEDIA",
        "A file up to 10 MB is required",
      );
    }
    const mimeType = detectMediaType(file.buffer);
    if (!mimeType || mimeType !== file.mimetype.toLowerCase()) {
      throw new AppError(
        400,
        "INVALID_MEDIA_TYPE",
        "Unsupported or mismatched media type",
      );
    }
    const hash = createHash("sha256").update(file.buffer).digest("hex");
    const existing = await this.model
      .findOne({ ownerId: ownerObjectId, hash })
      .exec();
    if (existing) return this.serialize(existing);
    const storageKey = await this.storage.store(file.buffer);
    const id = new Types.ObjectId();
    try {
      const media = await this.model.create({
        _id: id,
        ownerId: ownerObjectId,
        hash,
        storageKey,
        url: this.storage.url(String(id)),
        mimeType,
        byteSize: file.buffer.length,
        status: "ready",
      });
      return toPublic(media);
    } catch (error) {
      await this.storage.remove(storageKey);
      if ((error as { code?: number }).code !== 11000) throw error;
      const duplicate = await this.model
        .findOne({ ownerId: ownerObjectId, hash })
        .exec();
      if (!duplicate) throw error;
      return this.serialize(duplicate);
    }
  }

  async getFile(id: string) {
    const media = await this.model
      .findOne({ _id: toObjectId(id, "MEDIA_NOT_FOUND"), status: "ready" })
      .exec();
    if (!media?.storageKey)
      throw new AppError(404, "MEDIA_NOT_FOUND", "Media not found");
    return {
      path: this.storage.path(media.storageKey),
      mimeType: media.mimeType,
    };
  }

  private async serialize(media: MediaDocument): Promise<PublicMedia> {
    // Convert old inline media on access without changing its referenced ID.
    if (media.url.startsWith("data:") && !media.storageKey) {
      const match = /^data:([^;,]+);base64,([a-z0-9+/]+={0,2})$/i.exec(
        media.url,
      );
      if (!match)
        throw new AppError(400, "INVALID_MEDIA", "Invalid legacy media");
      const content = Buffer.from(match[2]!, "base64");
      const mimeType = detectMediaType(content);
      if (!mimeType)
        throw new AppError(
          400,
          "INVALID_MEDIA_TYPE",
          "Unsupported legacy media",
        );
      const key = await this.storage.store(content);
      const update = {
        storageKey: key,
        url: this.storage.url(String(media._id)),
        mimeType,
        hash: createHash("sha256").update(content).digest("hex"),
        byteSize: content.length,
      };
      try {
        const result = await this.model
          .updateOne({ _id: media._id, url: media.url }, { $set: update })
          .exec();
        if (!result.modifiedCount) {
          await this.storage.remove(key);
          const current = await this.model.findById(media._id).exec();
          if (current) return toPublic(current);
          throw new AppError(404, "MEDIA_NOT_FOUND", "Media not found");
        }
      } catch (error) {
        await this.storage.remove(key);
        throw error;
      }
      Object.assign(media, update);
    }
    return toPublic(media);
  }

  async list(ownerId: string): Promise<{ items: PublicMedia[] }> {
    const items = await this.model
      .find({ ownerId: toObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    return {
      items: await Promise.all(items.map((item) => this.serialize(item))),
    };
  }

  async assertOwnedReady(ownerId: string, ids: string[]): Promise<void> {
    if (!ids.length) return;
    const objectIds = ids.map((id) => toObjectId(id, "MEDIA_NOT_FOUND"));
    const count = await this.model.countDocuments({
      _id: { $in: objectIds },
      ownerId: toObjectId(ownerId),
      status: "ready",
    });
    if (count !== new Set(ids).size) {
      throw new AppError(
        400,
        "MEDIA_NOT_FOUND",
        "Invalid or unavailable media",
      );
    }
  }

  async getReadyByIds(ids: string[]): Promise<PublicMedia[]> {
    if (!ids.length) return [];
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const items = await this.model
      .find({ _id: { $in: validIds }, status: "ready" })
      .exec();
    return Promise.all(items.map((item) => this.serialize(item)));
  }
}

function toPublic(media: MediaDocument): PublicMedia {
  const stored =
    media.hash && media.byteSize !== undefined
      ? null
      : prepareMedia(media.url, media.mimeType);
  return {
    id: String(media._id),
    hash: media.hash ?? stored!.hash,
    url: media.url,
    mimeType: media.mimeType,
    byteSize: media.byteSize ?? stored!.byteSize,
    status: media.status,
    createdAt: media.createdAt.toISOString(),
  };
}

export function prepareMedia(url: string, mimeType: string) {
  const normalizedUrl = url.trim();
  const normalizedMimeType = mimeType.trim().toLowerCase();
  const dataUrl = /^data:([^;,]+);base64,(.+)$/is.exec(normalizedUrl);
  const content = dataUrl
    ? Buffer.from(dataUrl[2]!, "base64")
    : Buffer.from(normalizedUrl, "utf8");

  return {
    url: normalizedUrl,
    mimeType: normalizedMimeType,
    hash: createHash("sha256").update(content).digest("hex"),
    byteSize: content.byteLength,
  };
}

function toObjectId(id: string, code = "USER_NOT_FOUND"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, code, "Not found");
  return new Types.ObjectId(id);
}

export function detectMediaType(content: Buffer): string | undefined {
  if (
    content
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (content[0] === 255 && content[1] === 216 && content[2] === 255)
    return "image/jpeg";
  if (["GIF87a", "GIF89a"].includes(content.toString("ascii", 0, 6)))
    return "image/gif";
  if (
    content.toString("ascii", 0, 4) === "RIFF" &&
    content.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (content.toString("ascii", 4, 8) === "ftyp") {
    const brand = content.toString("ascii", 8, 12);
    if (["avif", "avis"].includes(brand)) return "image/avif";
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V "].includes(brand))
      return "video/mp4";
    if (brand === "qt  ") return "video/quicktime";
  }
  if (
    content.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])) &&
    content.subarray(0, 4096).includes(Buffer.from("webm"))
  )
    return "video/webm";
  return undefined;
}
