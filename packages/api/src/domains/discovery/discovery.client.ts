import { http } from "../../http/client";
import type {
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
import { discoveryEndpoints } from "./discovery.endpoints";

export const discoveryClient = {
  listClubs: (params?: ListClubsParams) =>
    http.get<ListClubsResponse>(discoveryEndpoints.clubs, params),

  createClub: (payload: CreateClubPayload) =>
    http.post<Club>(discoveryEndpoints.clubs, payload),

  getClub: (clubId: string) => http.get<Club>(discoveryEndpoints.club(clubId)),

  listClasses: (clubId: string) =>
    http.get<ListClassesResponse>(discoveryEndpoints.classes(clubId)),

  createClass: (clubId: string, payload: CreateClassPayload) =>
    http.post<ClubClass>(discoveryEndpoints.classes(clubId), payload),

  listSlots: (clubId: string) =>
    http.get<ListSlotsResponse>(discoveryEndpoints.slots(clubId)),

  createSlot: (clubId: string, payload: CreateSlotPayload) =>
    http.post<ClubSlot>(discoveryEndpoints.slots(clubId), payload),

  reserveSlot: (clubId: string, payload: ReserveSlotPayload) =>
    http.post<Reservation>(discoveryEndpoints.reserveSlot(clubId), payload),
};
