export type DiscoveryClubsLocationKind = "city" | "district" | "province";

export type DiscoveryClubsLocationItem = {
  id: string;
  name: string;
  clubsCount: number;
  imageUrl: string;
  href: string;
  kind: DiscoveryClubsLocationKind;
};

export type DiscoveryClubsLocationsSectionProps = {
  items?: DiscoveryClubsLocationItem[];
  seeAllHref?: string;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
};
