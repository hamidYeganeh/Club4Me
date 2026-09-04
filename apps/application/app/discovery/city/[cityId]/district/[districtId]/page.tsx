import { getDiscoveryCity } from "@modules/discovery/discovery-city.constants";
import { DISCOVERY_CITY_DETAILS } from "@modules/discovery/discovery-city.constants";
import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";

type PageProps = { params: Promise<{ cityId: string; districtId: string }> };

export function generateStaticParams() {
  return DISCOVERY_CITY_DETAILS.flatMap((city) =>
    city.districts.map((district) => ({
      cityId: city.id,
      districtId: district.id,
    })),
  );
}

export default async function DistrictPage({ params }: PageProps) {
  const { cityId, districtId } = await params;
  const city = getDiscoveryCity(cityId);
  const district = city?.districts.find((entry) => entry.id === districtId);
  return (
    <DiscoveryClubsScreen
      title={`باشگاه‌های ${district?.name ?? "منطقه"}`}
      description={`بهترین باشگاه‌های ${district?.name ?? "این منطقه"} در ${city?.name ?? "شهر"}`}
    />
  );
}
