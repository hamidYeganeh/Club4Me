export const locationsQueries = {
  all: () => ["user-locations"] as const,
  list: () => [...locationsQueries.all(), "list"] as const,
};
