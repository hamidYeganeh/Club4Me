import type { IconName } from "@theme/icon";

import type { PublicCatalogClass, PublicCatalogParams } from "@api/discovery";

export type DiscoveryClassesRailSectionProps = {
  skeletonCount?: number;
  isLoading?: boolean;
  id: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  seeAllHref?: string;
  seeAllLabel?: string;
  items?: PublicCatalogClass[];
  params?: PublicCatalogParams;
  className?: string;
};
