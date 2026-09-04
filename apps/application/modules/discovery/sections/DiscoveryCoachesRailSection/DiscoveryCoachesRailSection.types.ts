import type { IconName } from "@theme/icon";
import type { CoachCardType } from "@ui/coach-card";

import type { DiscoveryCoachItem } from "@modules/discovery/discovery-coaches.mock";

export type DiscoveryCoachesRailSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  seeAllHref?: string;
  seeAllLabel?: string;
  items: DiscoveryCoachItem[];
  cardType?: CoachCardType;
  className?: string;
};
