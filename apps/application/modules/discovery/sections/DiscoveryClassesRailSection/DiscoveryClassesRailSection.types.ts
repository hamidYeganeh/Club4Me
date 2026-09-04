import type { IconName } from "@theme/icon";

import type { DiscoveryClassItem } from "@modules/discovery/discovery-classes.mock";

export type DiscoveryClassesRailSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  seeAllHref?: string;
  seeAllLabel?: string;
  items?: DiscoveryClassItem[];
  className?: string;
};
