import { z } from "zod";

export class VerifyClubDto {
  static schema = z
    .object({
      kind: z.enum(["identity", "documents", "on_site"]),
      verified: z.boolean(),
    })
    .strict();
  kind: "identity" | "documents" | "on_site";
  verified: boolean;
}
