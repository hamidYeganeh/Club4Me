import { Icon, iconNames, type IconName } from "@theme/icon";
export function ResourceIcon({
  icon,
  fallback = "star-full",
}: {
  icon?: string;
  fallback?: IconName;
}) {
  return (
    <Icon
      name={
        iconNames.includes(icon as IconName) ? (icon as IconName) : fallback
      }
      size={18}
      className="me-1 inline-block align-middle text-accent"
    />
  );
}
