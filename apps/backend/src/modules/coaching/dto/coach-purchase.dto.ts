import { z } from "zod";
export class CreateCoachPurchaseDto {
  static schema = z
    .object({ idempotencyKey: z.string().trim().min(8).max(120) })
    .strict();
  idempotencyKey: string;
}
