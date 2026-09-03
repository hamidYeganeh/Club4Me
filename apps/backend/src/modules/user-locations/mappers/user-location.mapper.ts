import type { UserLocationDocument } from "../schemas/user-location.schema";

export type PublicUserLocation = {
  id: string;
  title: string;
  countryId: string;
  provinceId: string;
  cityId: string;
  districtId: string | null;
  cityRegionId: string | null;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toPublicUserLocation(
  location: UserLocationDocument,
): PublicUserLocation {
  return {
    id: String(location._id),
    title: location.title,
    countryId: String(location.geo.countryId),
    provinceId: String(location.geo.provinceId),
    cityId: String(location.geo.cityId),
    districtId: location.geo.districtId
      ? String(location.geo.districtId)
      : null,
    cityRegionId: location.geo.cityRegionId
      ? String(location.geo.cityRegionId)
      : null,
    address: location.address,
    latitude: location.location.coordinates[1],
    longitude: location.location.coordinates[0],
    isDefault: location.isDefault,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };
}
