import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({
  collection: "article_categories",
  timestamps: true,
})
export class ArticleCategory {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, unique: true, sparse: true, index: true })
  code?: string;

  @Prop({ select: false, unique: true, sparse: true, index: true })
  normalizedName?: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  icon?: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 0, min: 0, index: true })
  sortOrder: number;

  @Prop({ type: [String], default: [] })
  aliases: string[];

  createdAt: Date;
  updatedAt: Date;
}

export type ArticleCategoryDocument = HydratedDocument<ArticleCategory>;
export const ArticleCategorySchema =
  SchemaFactory.createForClass(ArticleCategory);
