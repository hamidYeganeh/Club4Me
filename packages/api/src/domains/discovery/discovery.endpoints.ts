export const discoveryEndpoints = {
  feed: "/discovery/sections",
  catalogClubs: "/discovery/catalog/clubs",
  catalogClub: (identifier: string) => `/discovery/catalog/clubs/${identifier}`,
  catalogCoaches: "/discovery/catalog/coaches",
  catalogCoach: (identifier: string) =>
    `/discovery/catalog/coaches/${identifier}`,
  catalogClasses: "/discovery/catalog/classes",
  catalogClass: (identifier: string) =>
    `/discovery/catalog/classes/${identifier}`,
  catalogArticles: "/discovery/catalog/articles",
  catalogArticle: (slug: string) => `/discovery/catalog/articles/${slug}`,
  catalogSearch: "/discovery/catalog/search",
  catalogClubTypes: "/discovery/catalog/club-types",
  coachSections: "/discovery/coaches/sections",
  coaches: "/discovery/coaches",
  publicResource: (category: string, resource: string) =>
    `/public/catalog/${category}/${resource}`,
  clubs: "/discovery/clubs",
  club: (clubId: string) => `/discovery/clubs/${clubId}`,
  classes: (clubId: string) => `/discovery/clubs/${clubId}/classes`,
  slots: (clubId: string) => `/discovery/clubs/${clubId}/slots`,
  reserveSlot: (clubId: string) => `/discovery/clubs/${clubId}/slots/reserve`,
} as const;
