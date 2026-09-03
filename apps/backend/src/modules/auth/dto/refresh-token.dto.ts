import { z } from "zod";

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export class RefreshTokenDto {
  static schema = RefreshTokenSchema;
  refreshToken: string;
}
