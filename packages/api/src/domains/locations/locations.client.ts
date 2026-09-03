import { http } from "../../http/client";
import type {
  CreateUserLocationPayload,
  DeleteUserLocationResponse,
  ListUserLocationsResponse,
  UpdateUserLocationPayload,
  UserLocation,
} from "./locations.dto";
import { locationsEndpoints } from "./locations.endpoints";

export const locationsClient = {
  list: () => http.get<ListUserLocationsResponse>(locationsEndpoints.list),
  create: (payload: CreateUserLocationPayload) =>
    http.post<UserLocation>(locationsEndpoints.list, payload),
  update: (id: string, payload: UpdateUserLocationPayload) =>
    http.patch<UserLocation>(locationsEndpoints.detail(id), payload),
  remove: (id: string) =>
    http.delete<DeleteUserLocationResponse>(locationsEndpoints.detail(id)),
  setDefault: (id: string) =>
    http.patch<UserLocation>(locationsEndpoints.setDefault(id)),
};
