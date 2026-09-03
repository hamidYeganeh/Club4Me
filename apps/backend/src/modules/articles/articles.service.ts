import { Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import type { UserRole } from "../../lib/roles";
import { ArticleCategoriesRepository } from "./article-categories.repository";
import { ArticlesRepository } from "./articles.repository";
import type { CreateArticleCategoryDto } from "./dto/create-article-category.dto";
import type { CreateArticleDto } from "./dto/create-article.dto";
import type { UpdateArticleDto } from "./dto/update-article.dto";
import type { PublicArticleCategory } from "./mappers/article-category.mapper";
import type { PublicArticle } from "./mappers/article.mapper";

@Injectable()
export class ArticlesService {
  constructor(
    private readonly articlesRepository: ArticlesRepository,
    private readonly categoriesRepository: ArticleCategoriesRepository,
  ) {}

  async listArticles(
    actorRoles: UserRole[],
  ): Promise<{ items: PublicArticle[] }> {
    assertAdmin(actorRoles);
    const categories = await this.categoriesRepository.listAll();
    const names = new Map(
      categories.map((category) => [category.id, category.name]),
    );

    return {
      items: await this.articlesRepository.listRecent(names),
    };
  }

  async getArticle(actorRoles: UserRole[], id: string): Promise<PublicArticle> {
    assertAdmin(actorRoles);

    const article = await this.articlesRepository.findById(id, "");
    if (!article) {
      throw new AppError(404, "ARTICLE_NOT_FOUND", "Article not found");
    }

    const categoryName =
      (await this.categoriesRepository.getNameById(article.categoryId)) ?? "";

    return { ...article, categoryName };
  }

  async createArticle(
    actorRoles: UserRole[],
    input: CreateArticleDto,
  ): Promise<PublicArticle> {
    assertAdmin(actorRoles);

    const categoryName = await this.requireCategoryName(input.categoryId);
    return this.articlesRepository.create(input, categoryName);
  }

  async updateArticle(
    actorRoles: UserRole[],
    id: string,
    input: UpdateArticleDto,
  ): Promise<PublicArticle> {
    assertAdmin(actorRoles);

    const existing = await this.articlesRepository.findById(id, "");
    if (!existing) {
      throw new AppError(404, "ARTICLE_NOT_FOUND", "Article not found");
    }

    const categoryId = input.categoryId ?? existing.categoryId;
    const categoryName = await this.requireCategoryName(categoryId);
    return this.articlesRepository.update(id, input, categoryName);
  }

  async deleteArticle(
    actorRoles: UserRole[],
    id: string,
  ): Promise<{ success: true }> {
    assertAdmin(actorRoles);
    await this.articlesRepository.delete(id);
    return { success: true };
  }

  async listCategories(
    actorRoles: UserRole[],
  ): Promise<{ items: PublicArticleCategory[] }> {
    assertAdmin(actorRoles);
    return { items: await this.categoriesRepository.listAll() };
  }

  async createCategory(
    actorRoles: UserRole[],
    input: CreateArticleCategoryDto,
  ): Promise<PublicArticleCategory> {
    assertAdmin(actorRoles);
    return this.categoriesRepository.create(input);
  }

  private async requireCategoryName(categoryId: string): Promise<string> {
    const name = await this.categoriesRepository.getNameById(categoryId);
    if (!name) {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }
    return name;
  }
}

function assertAdmin(actorRoles: UserRole[]): void {
  if (!actorRoles.includes("admin")) {
    throw new AppError(403, "FORBIDDEN", "Admin access required");
  }
}
