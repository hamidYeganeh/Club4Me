import { resourceApiPath } from "./resources.registry";
export const resourcesEndpoints = {
  list: (category: string, resource: string) =>
    resourceApiPath(category, resource),
  detail: (category: string, resource: string, id: string) =>
    `${resourceApiPath(category, resource)}/${id}` as const,
  seed: (category: string, resource: string) =>
    `${resourceApiPath(category, resource)}/seed` as const,
} as const;
