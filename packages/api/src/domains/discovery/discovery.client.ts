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
  DiscoverySection,
  PublicCatalogClass,
  PublicCatalogClub,
  PublicCatalogCoach,
  PublicCatalogClubTypesResponse,
  PublicCatalogPage,
  PublicCatalogParams,
  PublicCatalogSearchResponse,
  PublicResourcePage,
} from "./discovery.dto";
import { discoveryEndpoints } from "./discovery.endpoints";

export const discoveryClient = {
  getFeed: () => http.get<DiscoverySection[]>(discoveryEndpoints.feed),

  listCatalogClubs: (params?: PublicCatalogParams) =>
    http.get<PublicCatalogPage<PublicCatalogClub>>(
      discoveryEndpoints.catalogClubs,
      params,
    ),
  getCatalogClub: (identifier: string) =>
    http.get<PublicCatalogClub>(discoveryEndpoints.catalogClub(identifier)),

  listCatalogCoaches: (params?: PublicCatalogParams) =>
    http.get<PublicCatalogPage<PublicCatalogCoach>>(
      discoveryEndpoints.catalogCoaches,
      params,
    ),
  getCatalogCoach: (identifier: string) =>
    http.get<PublicCatalogCoach>(discoveryEndpoints.catalogCoach(identifier)),

  listCatalogClasses: (params?: PublicCatalogParams) =>
    http.get<PublicCatalogPage<PublicCatalogClass>>(
      discoveryEndpoints.catalogClasses,
      params,
    ),
  getCatalogClass: (identifier: string) =>
    http.get<PublicCatalogClass>(discoveryEndpoints.catalogClass(identifier)),

  searchCatalog: (params?: PublicCatalogParams & { kind?: string }) =>
    http.get<PublicCatalogSearchResponse>(
      discoveryEndpoints.catalogSearch,
      params,
    ),

  listCatalogClubTypes: () =>
    http.get<PublicCatalogClubTypesResponse>(
      discoveryEndpoints.catalogClubTypes,
    ),

  listPublicResources: (
    category: string,
    resource: string,
    params?: Record<string, unknown>,
  ) =>
    http.get<PublicResourcePage>(
      discoveryEndpoints.publicResource(category, resource),
      params,
    ),

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
