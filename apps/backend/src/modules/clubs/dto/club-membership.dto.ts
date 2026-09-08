import { CLUB_PERMISSIONS, STAFF_PERMISSIONS } from "../club-permissions";
import { iranianPhone } from "../../../common/utils/phone.util";
import { Types } from "mongoose";
import { z } from "zod";

const objectId = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid ObjectId");
export class InviteClubMemberDto {
  static schema = z
    .object({
      userId: objectId.optional(),
      phone: iranianPhone.optional(),
      role: z.enum(["manager", "receptionist", "finance", "coach"]),
      permissions: z.array(z.enum(CLUB_PERMISSIONS)).max(100).default([]),
    })
    .strict()
    .refine(
      (value) => Boolean(value.userId) !== Boolean(value.phone),
      "Provide phone or userId",
    )
    .refine(
      (value) =>
        value.permissions.every((p) =>
          STAFF_PERMISSIONS[value.role].includes(p),
        ),
      "Permission exceeds this role",
    );
  userId?: string;
  phone?: string;
  role: "manager" | "receptionist" | "finance" | "coach";
  permissions: string[];
}
