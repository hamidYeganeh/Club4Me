import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "media", timestamps: true })
export class Media {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 2000 })
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
