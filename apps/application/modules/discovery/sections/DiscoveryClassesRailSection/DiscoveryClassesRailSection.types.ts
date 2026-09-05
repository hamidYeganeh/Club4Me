import type { IconName } from "@theme/icon";

import type { PublicCatalogClass, PublicCatalogParams } from "@api/discovery";

export type DiscoveryClassesRailSectionProps = {
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
