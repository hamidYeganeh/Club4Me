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
      layout="list"
      title={item?.title}
      description={item?.subtitle}
      browse={
        type === "club-types"
          ? { clubTypeId: id }
          : type === "sports"
            ? { sportId: id }
            : undefined
      }
    />
  );
}
