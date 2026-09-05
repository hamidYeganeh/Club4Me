import type { PublicCatalogParams } from "@api/discovery";
import type { IconName } from "@theme/icon";
import type { ClubCardSport, ClubCardVariant } from "@ui/club-card";

export type DiscoveryClubsRailClub = {
  id: string;
  slug: string;
  name: string;
  city?: string;
  district?: string;
  /** @deprecated Prefer city + district */
  address?: string;
  shortDescription?: string;
  imageUrl?: string | null;
  averageRating?: number;
  reviewsCount?: number;
  price?: number;
  sports?: ClubCardSport[];
};

export type DiscoveryClubsRailTone = "accent" | "surface";

export type DiscoveryClubsRailSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  seeAllHref: string;
  params?: PublicCatalogParams;
  enabled?: boolean;
  items?: DiscoveryClubsRailClub[];
  tone?: DiscoveryClubsRailTone;
  cardVariant?: ClubCardVariant;
};
