export const discoveryEndpoints = {
  clubs: "/discovery/clubs",
  club: (clubId: string) => `/discovery/clubs/${clubId}`,
  classes: (clubId: string) => `/discovery/clubs/${clubId}/classes`,
  slots: (clubId: string) => `/discovery/clubs/${clubId}/slots`,
  reserveSlot: (clubId: string) => `/discovery/clubs/${clubId}/slots/reserve`,
} as const;
