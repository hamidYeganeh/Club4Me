import { http } from "../../http/client";
import type {
  DeleteResourceResponse,
  ResourceListParams,
  ResourceListResponse,
  ResourceMutationPayload,
  ResourceRecord,
  SeedResourceResponse,
} from "./resources.dto";
import { resourcesEndpoints } from "./resources.endpoints";
export const resourcesClient = {
  seedAll: () =>
    http.post<{ created: number; existing: number }>(
      "/resources/registry?action=seed",
    ),
  list: (category: string, resource: string, params?: ResourceListParams) =>
    http.get<ResourceListResponse>(
      resourcesEndpoints.list(category, resource),
      params,
    ),
  get: (category: string, resource: string, id: string) =>
    http.get<ResourceRecord>(resourcesEndpoints.detail(category, resource, id)),
  create: (
    category: string,
    resource: string,
    payload: ResourceMutationPayload,
  ) =>
    http.post<ResourceRecord>(
      resourcesEndpoints.list(category, resource),
      payload,
    ),
  update: (
    category: string,
    resource: string,
    id: string,
    payload: ResourceMutationPayload,
  ) =>
    http.patch<ResourceRecord>(
      resourcesEndpoints.detail(category, resource, id),
      payload,
    ),
  remove: (category: string, resource: string, id: string) =>
    http.delete<DeleteResourceResponse>(
      resourcesEndpoints.detail(category, resource, id),
    ),
  seed: (category: string, resource: string) =>
    http.post<SeedResourceResponse>(
      resourcesEndpoints.seed(category, resource),
    ),
};
