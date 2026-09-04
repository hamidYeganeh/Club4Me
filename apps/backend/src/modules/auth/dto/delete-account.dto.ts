import { z } from "zod";

export class DeleteAccountDto {
  static schema = z.object({ confirmation: z.literal("DELETE") });
  confirmation: "DELETE";
}
