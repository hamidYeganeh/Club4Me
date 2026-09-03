export const articlesQueries = {
  all: () => ["articles"] as const,
  list: () => [...articlesQueries.all(), "list"] as const,
  detail: (id: string) => [...articlesQueries.all(), "detail", id] as const,
  categories: () => [...articlesQueries.all(), "categories"] as const,
};
