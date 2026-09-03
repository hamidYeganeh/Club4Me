import type { ResourceListParams } from "./resources.dto";
export const resourcesQueries = {
  all: () => ["resources"] as const,
  resource: (category: string, resource: string) =>
    ["resources", category, resource] as const,
  list: (category: string, resource: string, params: ResourceListParams = {}) =>
    ["resources", category, resource, "list", params] as const,
  detail: (category: string, resource: string, id: string) =>
    ["resources", category, resource, "detail", id] as const,
};
