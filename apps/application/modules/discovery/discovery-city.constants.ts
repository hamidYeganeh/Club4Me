import type { DiscoveryCityDetail } from "./discovery.types";

const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const DISCOVERY_CITY_DETAILS: DiscoveryCityDetail[] = [
  {
    id: "tehran-city",
    name: "تهران",
    clubsCount: 1284,
    imageUrl: unsplash("photo-1534438327276-14e7789c4591", 1400),
    districts: [
      {
        id: "district-2",
        name: "منطقه ۲",
        clubsCount: 146,
        imageUrl: unsplash("photo-1571019614242-c5c5dee9f50b"),
      },
      {
        id: "district-1",
        name: "منطقه ۱",
        clubsCount: 128,
        imageUrl: unsplash("photo-1517836357463-d25dfeac3438"),
      },
      {
        id: "district-3",
        name: "منطقه ۳",
        clubsCount: 97,
        imageUrl: unsplash("photo-1571902943202-507ec2618e8f"),
      },
      {
        id: "district-6",
        name: "منطقه ۶",
        clubsCount: 84,
        imageUrl: unsplash("photo-1540497077202-7c8a3999166f"),
      },
      {
        id: "district-22",
        name: "منطقه ۲۲",
        clubsCount: 62,
        imageUrl: unsplash("photo-1571019613454-1cb2f99b2d8b"),
      },
    ],
  },
];

export function getDiscoveryCity(cityId: string) {
  return DISCOVERY_CITY_DETAILS.find((city) => city.id === cityId);
}

export function getDiscoveryCityParams() {
  return DISCOVERY_CITY_DETAILS.map((city) => ({ cityId: city.id }));
}
