import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ regionId: string }> };
export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/public/catalog/location/city-region?limit=100",
    "regionId",
  );
}
export default async function RegionPage({ params }: PageProps) {
  const { regionId } = await params;
  return <DiscoveryCategoryScreen type="regions" id={regionId} />;
}
