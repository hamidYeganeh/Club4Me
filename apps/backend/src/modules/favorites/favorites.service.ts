import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import {
  Article,
  type ArticleDocument,
} from "../articles/schemas/article.schema";
import { AppError } from "../../common/errors/app.exception";
import { Club, type ClubDocument } from "../clubs/schemas/club.schema";
import {
  Coach,
  type CoachDocument,
  TrainingClass,
  type TrainingClassDocument,
} from "../coaching/schemas/coaching.schemas";
import {
  Favorite,
  type FavoriteDocument,
  type FavoriteEntityType,
} from "./schemas/favorite.schema";

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favorites: Model<FavoriteDocument>,
    @InjectModel(Article.name)
    private readonly articles: Model<ArticleDocument>,
    @InjectModel(Club.name) private readonly clubs: Model<ClubDocument>,
    @InjectModel(Coach.name) private readonly coaches: Model<CoachDocument>,
    @InjectModel(TrainingClass.name)
    private readonly classes: Model<TrainingClassDocument>,
  ) {}

  async list(userId: string) {
    const items = await this.favorites
      .find({ userId: objectId(userId, "USER_NOT_FOUND") })
      .sort({ createdAt: -1 })
      .lean();
    return {
      items: items.map((item) => ({
        id: String(item._id),
        entityType: item.entityType,
        entityId: String(item.entityId),
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async add(userId: string, entityType: FavoriteEntityType, entityId: string) {
    const target = objectId(entityId, "FAVORITE_TARGET_NOT_FOUND");
    await this.assertPublicTarget(entityType, target);
    const item = await this.favorites.findOneAndUpdate(
      {
        userId: objectId(userId, "USER_NOT_FOUND"),
        entityType,
        entityId: target,
      },
      { $setOnInsert: { createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return {
      id: String(item._id),
      entityType: item.entityType,
      entityId: String(item.entityId),
      createdAt: item.createdAt.toISOString(),
    };
  }

  async remove(
    userId: string,
    entityType: FavoriteEntityType,
    entityId: string,
  ) {
    await this.favorites.deleteOne({
      userId: objectId(userId, "USER_NOT_FOUND"),
      entityType,
      entityId: objectId(entityId, "FAVORITE_TARGET_NOT_FOUND"),
    });
    return { success: true as const };
  }

  private async assertPublicTarget(
    type: FavoriteEntityType,
    id: Types.ObjectId,
  ) {
    if (type === "article") {
      if (!(await this.articles.exists({ _id: id, status: "published" })))
        this.notFound();
      return;
    }
    if (type === "class") {
      const trainingClass = await this.classes.findOne({
        _id: id,
        status: {
          $in: ["published", "registration_closed", "in_progress"],
        },
      });
      if (!trainingClass) return this.notFound();
      const coach = await this.coaches.exists({
        _id: trainingClass.ownerCoachId,
        reviewStatus: "approved",
        visibility: "public",
      });
      const club = trainingClass.clubId
        ? await this.clubs.exists({
            _id: trainingClass.clubId,
            reviewStatus: "approved",
            visibility: "public",
          })
        : true;
      if (
        !coach ||
        !club ||
        (trainingClass.clubId &&
          trainingClass.clubApprovalStatus !== "approved")
      ) {
        return this.notFound();
      }
      return;
    }
    const exists =
      type === "club"
        ? await this.clubs.exists({
            _id: id,
            reviewStatus: "approved",
            visibility: "public",
          })
        : type === "coach"
          ? await this.coaches.exists({
              _id: id,
              reviewStatus: "approved",
              visibility: "public",
            })
          : null;
    if (!exists) this.notFound();
  }

  private notFound(): never {
    throw new AppError(
      404,
      "FAVORITE_TARGET_NOT_FOUND",
      "Favorite target not found",
    );
  }
}

function objectId(value: string, code: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, code, "Not found");
  }
  return new Types.ObjectId(value);
}
