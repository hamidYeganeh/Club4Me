import type { IconName } from "@theme/icon";
import type { ClubCardSport } from "@ui/club-card";

/** Temporary mock for discovery club rails. Remove when catalog data is live. */
export type MockDiscoveryRailSport = {
  id: string;
  name: string;
  icon: IconName;
};

export type MockDiscoveryRailClub = {
  id: string;
  name: string;
  city: string;
  district: string;
  shortDescription: string;
  imageUrl: string;
  averageRating: number;
  reviewsCount: number;
  price: number;
  sports: ClubCardSport[];
};

export const MOCK_DISCOVERY_RAIL_SPORTS: MockDiscoveryRailSport[] = [
  { id: "football", name: "فوتبال", icon: "soccer" },
  { id: "bodybuilding", name: "بدنسازی", icon: "weight" },
  { id: "volleyball", name: "والیبال", icon: "volleyball" },
  { id: "tennis", name: "تنیس", icon: "tennis" },
];

function toClubSport(sport: MockDiscoveryRailSport): ClubCardSport {
  return { id: sport.id, label: sport.name, icon: sport.icon };
}

const [football, bodybuilding, volleyball, tennis] = MOCK_DISCOVERY_RAIL_SPORTS;

export const MOCK_DISCOVERY_RAIL_CLUBS: MockDiscoveryRailClub[] = [
  {
    id: "mock-energy",
    name: "باشگاه انرژی",
    city: "تهران",
    district: "سعادت‌آباد",
    shortDescription: "قدرتي، هوازی و کلاس‌های گروهی",
    imageUrl: "/mock/clubs/01.jpg",
    averageRating: 4.8,
    reviewsCount: 214,
    price: 320_000,
    sports: [
      toClubSport(bodybuilding!),
      toClubSport(football!),
      toClubSport(volleyball!),
      toClubSport(tennis!),
    ],
  },
  {
    id: "mock-bam",
    name: "بام تهران",
    city: "تهران",
    district: "درکه",
    shortDescription: "تمرین با چشم‌انداز شهر",
    imageUrl: "/mock/clubs/02.jpg",
    averageRating: 4.6,
    reviewsCount: 168,
    price: 280_000,
    sports: [
      toClubSport(tennis!),
      toClubSport(bodybuilding!),
      toClubSport(football!),
    ],
  },
  {
    id: "mock-balance",
    name: "استودیو تعادل",
    city: "تهران",
    district: "ونک",
    shortDescription: "یوگا، پیلاتس و حرکات اصلاحی",
    imageUrl: "/mock/clubs/03.jpg",
    averageRating: 4.9,
    reviewsCount: 97,
    price: 240_000,
    sports: [
      toClubSport(volleyball!),
      toClubSport(tennis!),
      toClubSport(bodybuilding!),
    ],
  },
  {
    id: "mock-iron",
    name: "آیرون جیم",
    city: "تهران",
    district: "پاسداران",
    shortDescription: "بدنسازی و پاورلیفتینگ",
    imageUrl: "/mock/clubs/04.jpg",
    averageRating: 4.5,
    reviewsCount: 142,
    price: 210_000,
    sports: [toClubSport(bodybuilding!)],
  },
  {
    id: "mock-wave",
    name: "موج آبی",
    city: "تهران",
    district: "جردن",
    shortDescription: "استخر، سونا و ورزش‌های آبی",
    imageUrl: "/mock/clubs/05.jpg",
    averageRating: 4.7,
    reviewsCount: 121,
    price: 350_000,
    sports: [toClubSport(volleyball!), toClubSport(football!)],
  },
  {
    id: "mock-ring",
    name: "رینگ بوکس",
    city: "تهران",
    district: "تجریش",
    shortDescription: "بوکس، کیک‌بوکس و آمادگی رزمی",
    imageUrl: "/mock/clubs/06.jpg",
    averageRating: 4.4,
    reviewsCount: 86,
    price: 190_000,
    sports: [toClubSport(football!), toClubSport(tennis!)],
  },
];

export function mockRailClubs(offset = 0, count = 6): MockDiscoveryRailClub[] {
  const source = MOCK_DISCOVERY_RAIL_CLUBS;
  return Array.from({ length: count }, (_, index) => {
    const club = source[(index + offset) % source.length]!;
    return {
      ...club,
      id: `${club.id}-${offset}-${index}`,
      sports: [...club.sports],
    };
  });
}

export function formatClubCityDistrict(
  city?: string | null,
  district?: string | null,
): string | undefined {
  const parts = [city?.trim(), district?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join("، ") : undefined;
}
