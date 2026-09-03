export { locationsClient } from "./locations.client";
export type {
  CreateUserLocationPayload,
  DeleteUserLocationResponse,
  ListUserLocationsResponse,
  UpdateUserLocationPayload,
  UserLocation,
} from "./locations.dto";
export { locationsEndpoints } from "./locations.endpoints";
export {
  useCreateUserLocation,
  useDeleteUserLocation,
  useSetDefaultUserLocation,
  useUpdateUserLocation,
  useUserLocations,
} from "./locations.hooks";
export { locationsQueries } from "./locations.queries";
