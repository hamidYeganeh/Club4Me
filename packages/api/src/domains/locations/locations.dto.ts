export type UserLocation = {
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

export type ListUserLocationsResponse = { items: UserLocation[] };

export type CreateUserLocationPayload = {
  title: string;
  countryId: string;
  provinceId: string;
  cityId: string;
  districtId?: string | null;
  cityRegionId?: string | null;
  address?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
};

export type UpdateUserLocationPayload = Partial<CreateUserLocationPayload>;
export type DeleteUserLocationResponse = { success: true };
