import { z } from "zod";

import {
  USER_ACTIVITY_LEVELS,
  USER_GENDERS,
  type UserActivityLevel,
  type UserGender,
} from "../../users/schemas/user.schema";

const profileName = z.string().trim().min(2).max(100);

export const UpdateProfileSchema = z
  .object({
    firstName: profileName.optional(),
    lastName: profileName.optional(),
    birthdate: z.iso.date().optional(),
    gender: z.enum(USER_GENDERS).optional(),
    genderDescription: z.string().trim().min(1).max(300).optional(),
    activityLevel: z.enum(USER_ACTIVITY_LEVELS).optional(),
    idCard: z.string().regex(/^\d{10}$/).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required",
  })
  .refine(
    (value) =>
      value.gender !== "other" || Boolean(value.genderDescription?.trim()),
    {
      message: "Gender description is required when gender is other",
      path: ["genderDescription"],
    },
  );

export class UpdateProfileDto {
  static schema = UpdateProfileSchema;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  gender?: UserGender;
  genderDescription?: string;
  activityLevel?: UserActivityLevel;
  idCard?: string;
}
