export type ArticleStatus = "draft" | "published";

export type ArticleCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl?: string;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListArticlesResponse = {
  items: Article[];
};

export type ListArticleCategoriesResponse = {
  items: ArticleCategory[];
};

export type CreateArticlePayload = {
  title: string;
  slug?: string;
  authorName: string;
  categoryId: string;
  excerpt?: string;
  bodyHtml?: string;
  coverImageUrl?: string;
  status?: ArticleStatus;
};

export type UpdateArticlePayload = {
  title?: string;
  slug?: string;
  authorName?: string;
  categoryId?: string;
  excerpt?: string;
  bodyHtml?: string;
  coverImageUrl?: string;
  status?: ArticleStatus;
};

export type CreateArticleCategoryPayload = {
  name: string;
  slug?: string;
};

export type DeleteArticleResponse = {
  success: true;
};
