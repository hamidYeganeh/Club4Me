import type { PublicCatalogParams } from "@api/discovery";
import type { DiscoveryClubsRailClub } from "@modules/discovery/sections/DiscoveryClubsRailSection/DiscoveryClubsRailSection.types";

export type DiscoveryClubsEditorialListSectionProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  params?: PublicCatalogParams;
  enabled?: boolean;
  items?: DiscoveryClubsRailClub[];
};
