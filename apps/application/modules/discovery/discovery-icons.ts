import { iconNames, type IconName } from "@theme/icon";

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
  if (icon && ICON_NAME_SET.has(icon)) return icon as IconName;
  return (code ? CLUB_TYPE_ICONS[code] : undefined) ?? "weight";
}
