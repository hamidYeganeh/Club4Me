export const accountQueries = {
  all: () => ["account"] as const,
  me: () => [...accountQueries.all(), "me"] as const,
  profileChoices: () => [...accountQueries.all(), "profile-choices"] as const,
  roleRequests: () => [...accountQueries.all(), "role-requests"] as const,
};
