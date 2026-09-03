import { z } from "zod";

const ReviewClubSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    reason: z.string().trim().min(3).max(1000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "rejected" && !value.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A rejection reason is required",
      });
    }
  });

export class ReviewClubDto {
  static schema = ReviewClubSchema;
  status: "approved" | "rejected";
  reason?: string;
}
