import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import type { CreateMediaDto } from "./dto/create-media.dto";
import { Media, type MediaDocument } from "./schemas/media.schema";

export type PublicMedia = {
  id: string;
  url: string;
  mimeType: string;
  status: "ready" | "blocked";
  createdAt: string;
};

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name) private readonly model: Model<MediaDocument>,
  ) {}

  async create(ownerId: string, input: CreateMediaDto): Promise<PublicMedia> {
    const media = await this.model.create({
      ownerId: toObjectId(ownerId),
      url: input.url.trim(),
      mimeType: input.mimeType.trim().toLowerCase(),
      status: "ready",
    });
    return toPublic(media);
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
  return {
    id: String(media._id),
    url: media.url,
    mimeType: media.mimeType,
    status: media.status,
    createdAt: media.createdAt.toISOString(),
  };
}

function toObjectId(id: string, code = "USER_NOT_FOUND"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, code, "Not found");
  return new Types.ObjectId(id);
}
