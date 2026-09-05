import { DiscoveryProvinceScreen } from "@modules/discovery/screens/DiscoveryProvinceScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ provinceId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/public/catalog/location/province?limit=100",
    "provinceId",
  );
}

export default async function ProvincePage({ params }: PageProps) {
  const { provinceId } = await params;
  return <DiscoveryProvinceScreen provinceId={provinceId} />;
}
