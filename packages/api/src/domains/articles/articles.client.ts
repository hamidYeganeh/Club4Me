import { http } from "../../http/client";
import type {
  Article,
  ArticleCategory,
  CreateArticleCategoryPayload,
  CreateArticlePayload,
  DeleteArticleResponse,
  ListArticleCategoriesResponse,
  ListArticlesResponse,
  UpdateArticlePayload,
} from "./articles.dto";
import { articlesEndpoints } from "./articles.endpoints";

export const articlesClient = {
  list: () => http.get<ListArticlesResponse>(articlesEndpoints.list),

  get: (id: string) => http.get<Article>(articlesEndpoints.detail(id)),

  create: (payload: CreateArticlePayload) =>
    http.post<Article>(articlesEndpoints.list, payload),

  update: (id: string, payload: UpdateArticlePayload) =>
    http.patch<Article>(articlesEndpoints.detail(id), payload),

  remove: (id: string) =>
    http.delete<DeleteArticleResponse>(articlesEndpoints.detail(id)),

  listCategories: () =>
    http.get<ListArticleCategoriesResponse>(articlesEndpoints.categories),

  createCategory: (payload: CreateArticleCategoryPayload) =>
    http.post<ArticleCategory>(articlesEndpoints.categories, payload),
};
