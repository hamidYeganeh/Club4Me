export const articlesEndpoints = {
  list: "/admin/articles",
  detail: (id: string) => `/admin/articles/${id}` as const,
  categories: "/admin/article-categories",
} as const;
