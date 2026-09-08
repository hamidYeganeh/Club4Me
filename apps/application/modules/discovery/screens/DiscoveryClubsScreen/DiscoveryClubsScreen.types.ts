import type { ReactNode } from "react";
import type { PublicCatalogParams } from "@api/discovery";

export type DiscoveryClubsBrowse = {
  sort?: "newest" | "rating";
  sportId?: string;
  clubTypeId?: string;
  clubTypeSlug?: string;
  nearby?: boolean;
};

export type DiscoveryClubsScreenProps = {
  intro?: ReactNode;
  title?: string;
  description?: string;
  layout?: "rails" | "list";
  browse?: DiscoveryClubsBrowse;
  initialFilters?: PublicCatalogParams;
};
