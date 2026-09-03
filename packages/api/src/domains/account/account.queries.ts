export const accountQueries = {
  all: () => ["account"] as const,
  me: () => [...accountQueries.all(), "me"] as const,
  roleRequests: () => [...accountQueries.all(), "role-requests"] as const,
};
