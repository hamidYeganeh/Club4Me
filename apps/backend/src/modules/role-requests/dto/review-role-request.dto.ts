import { z } from "zod";

const ReviewRoleRequestSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
  })
  .strict();

export class ReviewRoleRequestDto {
  static schema = ReviewRoleRequestSchema;
  status: "approved" | "rejected";
}
