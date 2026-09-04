import { DISCOVERY_CATEGORIES } from "@modules/discovery/discovery-catalog.constants";
import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen";

type PageProps = { params: Promise<{ regionId: string }> };
export function generateStaticParams() {
  return DISCOVERY_CATEGORIES.regions.map(({ id }) => ({ regionId: id }));
}
export default async function RegionPage({ params }: PageProps) {
  const { regionId } = await params;
  return <DiscoveryCategoryScreen type="regions" id={regionId} />;
}
