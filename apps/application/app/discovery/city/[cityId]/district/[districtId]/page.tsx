import { DiscoveryDistrictScreen } from "@modules/discovery/screens/DiscoveryDistrictScreen";
import { getDistrictSlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ cityId: string; districtId: string }> };

export function generateStaticParams() {
  return getDistrictSlugParams();
}

export default async function DistrictPage({ params }: PageProps) {
  const { cityId, districtId } = await params;
  return (
    <DiscoveryDistrictScreen citySlug={cityId} districtSlug={districtId} />
  );
}
