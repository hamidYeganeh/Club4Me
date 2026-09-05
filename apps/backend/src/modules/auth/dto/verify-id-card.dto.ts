import { z } from "zod";

export const VerifyIdCardSchema = z.object({
  idCard: z.string().trim().regex(/^\d{10}$/),
});

export class VerifyIdCardDto {
  static schema = VerifyIdCardSchema;
  idCard: string;
}
