import { iconNames, type IconName } from "@theme/icon";

import type { DiscoveryClubTypeItem } from "./sections/DiscoveryClubTypesSection/DiscoveryClubTypesSection.types";

const ICON_NAME_SET = new Set<string>(iconNames);

const CLUB_TYPE_ICONS: Record<string, IconName> = {
  GYM: "weight",
  GYM_DEMO: "weight",
  SPORT_COMPLEX: "building-1",
  POOL: "person-swimming",
  ACADEMY: "academic-cap",
  STUDIO: "person-yoga",
  MARTIAL_ARTS: "boxing",
  FOOTBALL_FIELD: "soccer-field",
  TENNIS: "tennis",
  VOLLEYBALL: "volleyball",
};

export function resolveClubTypeIcon(
  code?: string | null,
  icon?: string | null,
): IconName {
  if (icon && ICON_NAME_SET.has(icon)) {
    return icon as IconName;
  }
  const mapped = code ? CLUB_TYPE_ICONS[code] : undefined;
  return mapped ?? "weight";
}

/** Temporary mock for discovery club-type rails. Remove when catalog data is live. */
export const MOCK_DISCOVERY_CLUB_TYPES: DiscoveryClubTypeItem[] = [
  {
    id: "gym",
    name: "باشگاه بدنسازی",
    clubsCount: 186,
    icon: "weight",
    href: "/discovery/club-types/gym",
  },
  {
    id: "sport-complex",
    name: "مجموعه ورزشی",
    clubsCount: 94,
    icon: "building-1",
    href: "/discovery/club-types/sport-complex",
  },
  {
    id: "pool",
    name: "استخر",
    clubsCount: 72,
    icon: "person-swimming",
    href: "/discovery/club-types/pool",
  },
  {
    id: "academy",
    name: "آکادمی تخصصی",
    clubsCount: 41,
    icon: "academic-cap",
    href: "/discovery/club-types/academy",
  },
  {
    id: "studio",
    name: "استودیو ورزشی",
    clubsCount: 58,
    icon: "person-yoga",
    href: "/discovery/club-types/studio",
  },
  {
    id: "martial-arts",
    name: "سالن رزمی",
    clubsCount: 36,
    icon: "boxing",
    href: "/discovery/club-types/martial-arts",
  },
  {
    id: "football-field",
    name: "زمین فوتبال",
    clubsCount: 29,
    icon: "soccer-field",
    href: "/discovery/club-types/football-field",
  },
  {
    id: "tennis",
    name: "باشگاه تنیس",
    clubsCount: 18,
    icon: "tennis",
    href: "/discovery/club-types/tennis",
  },
  {
    id: "volleyball",
    name: "سالن والیبال",
    clubsCount: 24,
    icon: "volleyball",
    href: "/discovery/club-types/volleyball",
  },
];
