export const locationsEndpoints = {
  list: "/me/locations",
  detail: (id: string) => `/me/locations/${id}` as const,
  setDefault: (id: string) => `/me/locations/${id}/default` as const,
} as const;
