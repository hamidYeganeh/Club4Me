import type { IconName } from "@theme/icon";
import type { CoachCardType } from "@ui/coach-card";

import type { DiscoveryCoachItem } from "@api/discovery";

export type DiscoveryCoachesRailSectionProps = {
  skeletonCount?: number;
  id: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  seeAllHref?: string;
  seeAllLabel?: string;
  items: DiscoveryCoachItem[];
  cardType?: CoachCardType;
  className?: string;
  isLoading?: boolean;
};
