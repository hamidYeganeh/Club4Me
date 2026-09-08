import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import {
  CLUB_PERMISSIONS,
  effectiveClubPermissions,
  type ClubPermission,
} from "./club-permissions";

@Injectable()
export class ClubAccessService {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  async hasPortalAccess(userId: string, roles: string[]) {
    if (roles.includes("owner")) return true;
    if (!Types.ObjectId.isValid(userId)) return false;
    return Boolean(
      await this.connection.collection("club_memberships").findOne({
        userId: new Types.ObjectId(userId),
        status: "accepted",
        role: { $in: ["manager", "receptionist", "finance", "coach"] },
      }),
    );
  }
  async permissions(userId: string, clubId: string): Promise<ClubPermission[]> {
    if (![userId, clubId].every(Types.ObjectId.isValid)) return [];
    const club = await this.connection
      .collection("clubs")
      .findOne(
        { _id: new Types.ObjectId(clubId) },
        { projection: { ownerId: 1 } },
      );
    if (!club) return [];
    if (String(club.ownerId) === userId) return [...CLUB_PERMISSIONS];
    const membership = await this.connection
      .collection("club_memberships")
      .findOne({
        clubId: new Types.ObjectId(clubId),
        userId: new Types.ObjectId(userId),
        status: "accepted",
      });
    return membership
      ? effectiveClubPermissions(membership.role, membership.permissions)
      : [];
  }
  async assert(userId: string, clubId: string, permission: ClubPermission) {
    if (!(await this.permissions(userId, clubId)).includes(permission))
      throw new AppError(
        403,
        "CLUB_PERMISSION_REQUIRED",
        "This club operation is not permitted",
      );
  }
  async accessibleClubIds(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return [];
    const rows = await this.connection
      .collection("club_memberships")
      .find({ userId: new Types.ObjectId(userId), status: "accepted" })
      .toArray();
    return rows
      .filter((row) =>
        effectiveClubPermissions(row.role, row.permissions).includes(
          "club.read",
        ),
      )
      .map((row) => row.clubId);
  }
}
