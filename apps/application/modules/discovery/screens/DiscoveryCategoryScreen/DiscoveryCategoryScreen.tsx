import { DISCOVERY_CATEGORIES } from "@modules/discovery/discovery-catalog.constants";
import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";

export function DiscoveryCategoryScreen({
  type,
  id,
}: {
  type: keyof typeof DISCOVERY_CATEGORIES;
  id: string;
}) {
  const item = DISCOVERY_CATEGORIES[type].find((entry) => entry.id === id);
  return (
    <DiscoveryClubsScreen
      title={item?.title ?? "نتایج کشف"}
      description={item?.subtitle ?? "باشگاه‌های مرتبط با این دسته‌بندی"}
    />
  );
}
