import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const SetPasswordSchema = z.object({
  password,
  currentPassword: z.string().min(1).max(128).optional(),
});

export class SetPasswordDto {
  static schema = SetPasswordSchema;
  password: string;
  currentPassword?: string;
}
