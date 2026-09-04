import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export const FAVORITE_ENTITY_TYPES = ["club", "coach", "class"] as const;
export type FavoriteEntityType = (typeof FAVORITE_ENTITY_TYPES)[number];

@Schema({ collection: "favorites", timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: FAVORITE_ENTITY_TYPES, required: true })
  entityType: FavoriteEntityType;

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type FavoriteDocument = HydratedDocument<Favorite>;
export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index(
  { userId: 1, entityType: 1, entityId: 1 },
  { unique: true },
);
FavoriteSchema.index({ userId: 1, createdAt: -1 });
