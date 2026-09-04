import { z } from "zod";

const profileName = z.string().trim().min(2).max(100);

export const UpdateProfileSchema = z
  .object({
    firstName: profileName,
    lastName: profileName,
  })
  .strict();

export class UpdateProfileDto {
  static schema = UpdateProfileSchema;
  firstName: string;
  lastName: string;
}
