import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { createHash } from "node:crypto";

import { AppError } from "../../common/errors/app.exception";
import type { CreateMediaDto } from "./dto/create-media.dto";
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
  ) {}

  async create(ownerId: string, input: CreateMediaDto): Promise<PublicMedia> {
    const ownerObjectId = toObjectId(ownerId);
    const stored = prepareMedia(input.url, input.mimeType);
    const existing = await this.model
      .findOne({ ownerId: ownerObjectId, hash: stored.hash })
      .exec();
    if (existing) return toPublic(existing);

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
      return toPublic(duplicate);
    }
  }

  async list(ownerId: string): Promise<{ items: PublicMedia[] }> {
    const items = await this.model
      .find({ ownerId: toObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    return { items: items.map(toPublic) };
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
    return items.map(toPublic);
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
