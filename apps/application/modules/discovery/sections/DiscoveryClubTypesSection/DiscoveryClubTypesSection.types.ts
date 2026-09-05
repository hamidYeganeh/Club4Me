import type { IconName } from "@theme/icon";

export type DiscoveryClubTypeItem = {
  id: string;
  name: string;
  clubsCount: number;
  icon: IconName;
  href: string;
};

export type DiscoveryClubTypesSectionProps = {
  items?: DiscoveryClubTypeItem[];
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
};
