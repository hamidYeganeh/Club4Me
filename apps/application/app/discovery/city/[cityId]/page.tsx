import { DiscoveryCityScreen } from "@modules/discovery/screens/DiscoveryCityScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/geography/cities?action=options&limit=100",
    "cityId",
  );
}

export default async function CityDiscoveryPage({ params }: PageProps) {
  const { cityId } = await params;

  return <DiscoveryCityScreen cityId={cityId} />;
}
