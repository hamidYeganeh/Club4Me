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
  DiscoveryArticleItem,
  DiscoverySection,
  PublicCatalogClass,
  PublicCatalogArticle,
  PublicCatalogClub,
  PublicCatalogCoach,
  PublicCatalogClubTypesResponse,
  PublicCatalogPage,
  PublicCatalogParams,
  PublicCatalogSearchResponse,
  PublicCatalogSearchParams,
  PublicResourcePage,
} from "./discovery.dto";
import { discoveryEndpoints } from "./discovery.endpoints";

export const discoveryClient = {
  getFeed: (signal?: AbortSignal, placement = "discovery") =>
    http.get<DiscoverySection[]>(
      discoveryEndpoints.feed,
      { placement },
      signal,
    ),
  getCoachSections: (signal?: AbortSignal) =>
    http.get<DiscoverySection[]>(
      discoveryEndpoints.coachSections,
      undefined,
      signal,
    ),

  listCoaches: (params?: PublicCatalogParams, signal?: AbortSignal) =>
    http.get<PublicCatalogPage<PublicCatalogCoach>>(
      discoveryEndpoints.coaches,
      params,
      signal,
    ),

  listCatalogClubs: (params?: PublicCatalogParams, signal?: AbortSignal) =>
    http.get<PublicCatalogPage<PublicCatalogClub>>(
      discoveryEndpoints.catalogClubs,
      params,
      signal,
    ),
  getCatalogClub: (identifier: string, signal?: AbortSignal) =>
    http.get<PublicCatalogClub>(
      discoveryEndpoints.catalogClub(identifier),
      undefined,
      signal,
    ),

  listCatalogCoaches: (params?: PublicCatalogParams, signal?: AbortSignal) =>
    http.get<PublicCatalogPage<PublicCatalogCoach>>(
      discoveryEndpoints.catalogCoaches,
      params,
      signal,
    ),
  getCatalogCoach: (identifier: string, signal?: AbortSignal) =>
    http.get<PublicCatalogCoach>(
      discoveryEndpoints.catalogCoach(identifier),
      undefined,
      signal,
    ),

  listCatalogClasses: (params?: PublicCatalogParams, signal?: AbortSignal) =>
    http.get<PublicCatalogPage<PublicCatalogClass>>(
      discoveryEndpoints.catalogClasses,
      params,
      signal,
    ),
  getCatalogClass: (identifier: string, signal?: AbortSignal) =>
    http.get<PublicCatalogClass>(
      discoveryEndpoints.catalogClass(identifier),
      undefined,
      signal,
    ),

  listCatalogArticles: (params?: PublicCatalogParams, signal?: AbortSignal) =>
    http.get<PublicCatalogPage<DiscoveryArticleItem>>(
      discoveryEndpoints.catalogArticles,
      params,
      signal,
    ),
  getCatalogArticle: (slug: string, signal?: AbortSignal) =>
    http.get<PublicCatalogArticle>(
      discoveryEndpoints.catalogArticle(slug),
      undefined,
      signal,
    ),

  searchCatalog: (params?: PublicCatalogSearchParams, signal?: AbortSignal) =>
    http.get<PublicCatalogSearchResponse>(
      discoveryEndpoints.catalogSearch,
      params,
      signal,
    ),

  listCatalogClubTypes: (signal?: AbortSignal) =>
    http.get<PublicCatalogClubTypesResponse>(
      discoveryEndpoints.catalogClubTypes,
      undefined,
      signal,
    ),

  listPublicResources: (
    category: string,
    resource: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal,
  ) =>
    http.get<PublicResourcePage>(
      discoveryEndpoints.publicResource(category, resource),
      { ...params, action: "options" },
      signal,
    ),

  listClubs: (params?: ListClubsParams, signal?: AbortSignal) =>
    http.get<ListClubsResponse>(discoveryEndpoints.clubs, params, signal),

  createClub: (payload: CreateClubPayload) =>
    http.post<Club>(discoveryEndpoints.clubs, payload),

  getClub: (clubId: string, signal?: AbortSignal) =>
    http.get<Club>(discoveryEndpoints.club(clubId), undefined, signal),

  listClasses: (clubId: string, signal?: AbortSignal) =>
    http.get<ListClassesResponse>(
      discoveryEndpoints.classes(clubId),
      undefined,
      signal,
    ),

  createClass: (clubId: string, payload: CreateClassPayload) =>
    http.post<ClubClass>(discoveryEndpoints.classes(clubId), payload),

  listSlots: (clubId: string, signal?: AbortSignal) =>
    http.get<ListSlotsResponse>(
      discoveryEndpoints.slots(clubId),
      undefined,
      signal,
    ),

  createSlot: (clubId: string, payload: CreateSlotPayload) =>
    http.post<ClubSlot>(discoveryEndpoints.slots(clubId), payload),

  reserveSlot: (clubId: string, payload: ReserveSlotPayload) =>
    http.post<Reservation>(discoveryEndpoints.reserveSlot(clubId), payload),
};
