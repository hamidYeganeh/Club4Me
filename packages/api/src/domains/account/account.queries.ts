export const accountQueries = {
  all: () => ["account"] as const,
  me: () => [...accountQueries.all(), "me"] as const,
};
