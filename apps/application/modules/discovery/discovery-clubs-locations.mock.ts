import { DISCOVERY_CITIES, DISCOVERY_PROVINCES } from "./discovery.constants";
import { DISCOVERY_CITY_DETAILS } from "./discovery-city.constants";
import type { DiscoveryClubsLocationItem } from "./sections/DiscoveryClubsLocationsSection/DiscoveryClubsLocationsSection.types";

/** Temporary mock mix of cities, districts, and provinces for clubs rails. */
export function buildDiscoveryClubsLocations(): DiscoveryClubsLocationItem[] {
  const cities: DiscoveryClubsLocationItem[] = DISCOVERY_CITIES.slice(0, 6).map(
    (city) => ({
      id: `city-${city.id}`,
      name: city.name,
      clubsCount: city.clubsCount,
      imageUrl: city.imageUrl,
      href: `/discovery/city/${city.id}`,
      kind: "city",
    }),
  );

  const districts: DiscoveryClubsLocationItem[] =
    DISCOVERY_CITY_DETAILS.flatMap((city) =>
      city.districts.map((district) => ({
        id: `district-${city.id}-${district.id}`,
        name: district.name,
        clubsCount: district.clubsCount,
        imageUrl: district.imageUrl,
        href: `/discovery/city/${city.id}/district/${district.id}`,
        kind: "district" as const,
      })),
    );

  const provinces: DiscoveryClubsLocationItem[] = DISCOVERY_PROVINCES.slice(
    0,
    4,
  ).map((province) => {
    const cover =
      province.cities[0]?.imageUrl ??
      cities[0]?.imageUrl ??
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80";

    return {
      id: `province-${province.id}`,
      name: province.name,
      clubsCount: province.cities.reduce(
        (total, city) => total + city.clubsCount,
        0,
      ),
      imageUrl: cover,
      href: "/discovery/cities",
      kind: "province" as const,
    };
  });

  // Mix kinds so the two-row rail feels varied.
  const mixed: DiscoveryClubsLocationItem[] = [];
  const max = Math.max(cities.length, districts.length, provinces.length);
  for (let index = 0; index < max; index += 1) {
    if (cities[index]) mixed.push(cities[index]!);
    if (districts[index]) mixed.push(districts[index]!);
    if (provinces[index]) mixed.push(provinces[index]!);
  }

  return mixed;
}
