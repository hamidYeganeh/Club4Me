import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { MAX_INLINE_IMAGE_URL_LENGTH } from "../media.constants";

@Schema({ collection: "media", timestamps: true })
export class Media {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: MAX_INLINE_IMAGE_URL_LENGTH })
  url: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ type: String, enum: ["ready", "blocked"], default: "ready" })
  status: "ready" | "blocked";

  createdAt: Date;
  updatedAt: Date;
}

export type MediaDocument = HydratedDocument<Media>;
export const MediaSchema = SchemaFactory.createForClass(Media);
MediaSchema.index({ ownerId: 1, createdAt: -1 });
