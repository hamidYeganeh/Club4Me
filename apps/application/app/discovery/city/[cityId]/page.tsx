import { getDiscoveryCityParams } from "@modules/discovery/discovery-city.constants";
import { DiscoveryCityScreen } from "@modules/discovery/screens/DiscoveryCityScreen";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

export function generateStaticParams() {
  return getDiscoveryCityParams();
}

export default async function CityDiscoveryPage({ params }: PageProps) {
  const { cityId } = await params;

  return <DiscoveryCityScreen cityId={cityId} />;
}
