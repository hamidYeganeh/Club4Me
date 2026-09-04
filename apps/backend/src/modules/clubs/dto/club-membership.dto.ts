import { Types } from "mongoose";
import { z } from "zod";

const objectId = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid ObjectId");
export class InviteClubMemberDto {
  static schema = z
    .object({
      userId: objectId,
      role: z.enum(["manager", "receptionist", "finance", "coach"]),
      permissions: z
        .array(z.string().trim().min(2).max(80))
        .max(100)
        .default([]),
    })
    .strict();
  userId: string;
  role: "manager" | "receptionist" | "finance" | "coach";
  permissions: string[];
}
