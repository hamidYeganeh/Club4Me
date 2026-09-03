import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

@Schema({
  collection: "articles",
  timestamps: true,
})
export class Article {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, trim: true })
  authorName: string;

  @Prop({
    type: Types.ObjectId,
    ref: "ArticleCategory",
    required: true,
    index: true,
  })
  categoryId: Types.ObjectId;

  @Prop({ trim: true, default: "" })
  excerpt: string;

  @Prop({ required: true, default: "" })
  bodyHtml: string;

  @Prop({ trim: true })
  coverImageUrl?: string;

  @Prop({
    type: String,
    enum: ARTICLE_STATUSES,
    default: "draft",
    index: true,
  })
  status: ArticleStatus;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type ArticleDocument = HydratedDocument<Article>;
export const ArticleSchema = SchemaFactory.createForClass(Article);
