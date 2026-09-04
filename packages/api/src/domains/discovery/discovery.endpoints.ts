export const discoveryEndpoints = {
  feed: "/discovery",
  catalogClubs: "/discovery/catalog/clubs",
  catalogClub: (identifier: string) =>
    `/discovery/catalog/clubs/${identifier}`,
  catalogCoaches: "/discovery/catalog/coaches",
  catalogCoach: (identifier: string) =>
    `/discovery/catalog/coaches/${identifier}`,
  catalogClasses: "/discovery/catalog/classes",
  catalogClass: (identifier: string) =>
    `/discovery/catalog/classes/${identifier}`,
  catalogSearch: "/discovery/catalog/search",
  publicResource: (category: string, resource: string) =>
    `/public/catalog/${category}/${resource}`,
  clubs: "/discovery/clubs",
  club: (clubId: string) => `/discovery/clubs/${clubId}`,
  classes: (clubId: string) => `/discovery/clubs/${clubId}/classes`,
  slots: (clubId: string) => `/discovery/clubs/${clubId}/slots`,
  reserveSlot: (clubId: string) => `/discovery/clubs/${clubId}/slots/reserve`,
} as const;
