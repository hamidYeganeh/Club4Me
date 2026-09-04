import type { IconName } from "@theme/icon";

export type DiscoveryClubLocation = {
  address: string;
  latitude: number;
  longitude: number;
};

export type DiscoveryFacilityItem = {
  id: string;
  title: string;
  count?: number;
  description?: string;
  icon?: IconName;
  backgroundImage?: string;
};

/** @deprecated Prefer DiscoveryFacilityItem */
export type DiscoveryAmenity = DiscoveryFacilityItem;

export type DiscoveryEquipment = DiscoveryFacilityItem;

export type DiscoverySport = {
  id: string;
  name: string;
  category: string;
  icon?: IconName;
  backgroundImage?: string;
};

export type DiscoveryCoach = {
  id: string;
  name: string;
  specialty: string;
  imageUrl: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  location: string;
  mode: string;
};

export type DiscoveryClub = {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: string;
  duration: string;
  distance: string;
  about: string;
  images: string[];
  map: DiscoveryClubLocation;
  amenities: DiscoveryAmenity[];
  equipment: DiscoveryEquipment[];
  sports: DiscoverySport[];
  coaches: DiscoveryCoach[];
};

export type DiscoveryCity = {
  id: string;
  name: string;
  clubsCount: number;
  imageUrl: string;
};

export type DiscoveryDistrict = {
  id: string;
  name: string;
  clubsCount: number;
  imageUrl: string;
};

export type DiscoveryCityDetail = DiscoveryCity & {
  districts: DiscoveryDistrict[];
};

export type DiscoveryProvince = {
  id: string;
  name: string;
  cities: DiscoveryCity[];
};
