import { UserLocationFieldsSchema } from "./create-user-location.dto";

const UpdateUserLocationSchema = UserLocationFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

export class UpdateUserLocationDto {
  static schema = UpdateUserLocationSchema;
  title?: string;
  countryId?: string;
  provinceId?: string;
  cityId?: string;
  districtId?: string | null;
  cityRegionId?: string | null;
  address?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}
