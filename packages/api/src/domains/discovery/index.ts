export { discoveryClient } from "./discovery.client";
export type {
  Club,
  ClubClass,
  ClubSlot,
  CreateClassPayload,
  CreateClubPayload,
  CreateSlotPayload,
  ListClassesResponse,
  ListClubsParams,
  ListClubsResponse,
  ListSlotsResponse,
  Reservation,
  ReserveSlotPayload,
} from "./discovery.dto";
export { discoveryEndpoints } from "./discovery.endpoints";
export {
  useClub,
  useClubClasses,
  useClubSlots,
  useClubs,
  useCreateClass,
  useCreateClub,
  useCreateSlot,
  useReserveSlot,
} from "./discovery.hooks";
export { discoveryQueries } from "./discovery.queries";
