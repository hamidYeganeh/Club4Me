import type { PublicCatalogParams } from "@api/discovery";

export type DiscoveryClubsBrowse = {
  sort?: "newest" | "rating";
  sportId?: string;
  clubTypeId?: string;
  nearby?: boolean;
};

export type DiscoveryClubsScreenProps = {
  title?: string;
  description?: string;
  layout?: "rails" | "list";
  browse?: DiscoveryClubsBrowse;
  initialFilters?: PublicCatalogParams;
};
