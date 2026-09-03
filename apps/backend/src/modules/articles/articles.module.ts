import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { ArticleCategoriesRepository } from "./article-categories.repository";
import { AdminArticlesController } from "./articles.controller";
import { ArticlesRepository } from "./articles.repository";
import { ArticlesService } from "./articles.service";
import {
  ArticleCategory,
  ArticleCategorySchema,
} from "./schemas/article-category.schema";
import { Article, ArticleSchema } from "./schemas/article.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: ArticleCategory.name, schema: ArticleCategorySchema },
    ]),
    AuthModule,
  ],
  controllers: [AdminArticlesController],
  providers: [ArticlesRepository, ArticleCategoriesRepository, ArticlesService],
})
export class ArticlesModule {}
