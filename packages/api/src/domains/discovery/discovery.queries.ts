import type { ListClubsParams } from "./discovery.dto";

export const discoveryQueries = {
  all: () => ["discovery"] as const,
  clubs: {
    all: () => [...discoveryQueries.all(), "clubs"] as const,
    list: (params?: ListClubsParams) =>
      [...discoveryQueries.clubs.all(), "list", params] as const,
    detail: (clubId: string) =>
      [...discoveryQueries.clubs.all(), "detail", clubId] as const,
    classes: (clubId: string) =>
      [...discoveryQueries.clubs.all(), clubId, "classes"] as const,
    slots: (clubId: string) =>
      [...discoveryQueries.clubs.all(), clubId, "slots"] as const,
  },
};
