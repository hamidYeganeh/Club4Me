import { Types } from "mongoose";
import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid ObjectId");

export const UserLocationFieldsSchema = z.object({
  title: z.string().trim().min(2).max(30),
  countryId: objectId,
  provinceId: objectId,
  cityId: objectId,
  districtId: objectId.nullish(),
  cityRegionId: objectId.nullish(),
  address: z.string().trim().max(300).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isDefault: z.boolean().optional(),
});

export class CreateUserLocationDto {
  static schema = UserLocationFieldsSchema;
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
}
