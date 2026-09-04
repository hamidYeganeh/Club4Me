import type { ListClubsParams, PublicCatalogParams } from "./discovery.dto";

export const discoveryQueries = {
  all: () => ["discovery"] as const,
  feed: () => [...discoveryQueries.all(), "feed"] as const,
  catalog: {
    all: () => [...discoveryQueries.all(), "catalog"] as const,
    clubs: (params?: PublicCatalogParams) =>
      [...discoveryQueries.catalog.all(), "clubs", params] as const,
    club: (identifier: string) =>
      [...discoveryQueries.catalog.all(), "club", identifier] as const,
    coaches: (params?: PublicCatalogParams) =>
      [...discoveryQueries.catalog.all(), "coaches", params] as const,
    coach: (identifier: string) =>
      [...discoveryQueries.catalog.all(), "coach", identifier] as const,
    classes: (params?: PublicCatalogParams) =>
      [...discoveryQueries.catalog.all(), "classes", params] as const,
    class: (identifier: string) =>
      [...discoveryQueries.catalog.all(), "class", identifier] as const,
    search: (params?: PublicCatalogParams & { kind?: string }) =>
      [...discoveryQueries.catalog.all(), "search", params] as const,
    resource: (
      category: string,
      resource: string,
      params?: Record<string, unknown>,
    ) =>
      [
        ...discoveryQueries.catalog.all(),
        "resource",
        category,
        resource,
        params,
      ] as const,
  },
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
