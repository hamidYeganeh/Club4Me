import {
  effectiveClubPermissions,
  STAFF_PERMISSIONS,
} from "./club-permissions";
import { toE164IranianPhone } from "../../common/utils/phone.util";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import { ClubsRepository } from "./clubs.repository";
import type { InviteClubMemberDto } from "./dto/club-membership.dto";
import {
  ClubMembership,
  type ClubMembershipDocument,
} from "./schemas/club-membership.schema";

@Injectable()
export class ClubMembershipsService {
  constructor(
    @InjectModel(ClubMembership.name)
    private readonly memberships: Model<ClubMembershipDocument>,
    private readonly clubs: ClubsRepository,
  ) {}

  async ensureOwner(clubId: string, userId: string) {
    await this.memberships.updateOne(
      { clubId: oid(clubId), userId: oid(userId) },
      {
        $setOnInsert: {
          role: "owner",
          permissions: ["*"],
          status: "accepted",
          invitedBy: oid(userId),
          acceptedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async list(ownerId: string, clubId: string) {
    await this.clubs.findForOwner(ownerId, clubId);
    const items = await this.memberships
      .find({ clubId: oid(clubId) })
      .sort({ createdAt: 1 });
    return {
      items: await Promise.all(
        items.map(async (item) => {
          const user = await this.memberships.db
            .collection("users")
            .findOne(
              { _id: item.userId },
              { projection: { phone: 1, firstName: 1, lastName: 1 } },
            );
          return {
            ...publicMembership(item),
            phone: user?.phone ?? null,
            name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          };
        }),
      ),
    };
  }

  async invite(ownerId: string, clubId: string, input: InviteClubMemberDto) {
    await this.clubs.findForOwner(ownerId, clubId);
    const user = await this.memberships.db
      .collection("users")
      .findOne(
        input.userId
          ? { _id: oid(input.userId) }
          : { phone: toE164IranianPhone(input.phone ?? "") },
      );
    if (!user)
      throw new AppError(
        404,
        "INVITEE_NOT_FOUND",
        "The invited person must first create an account",
      );
    const userId = String(user._id);
    if (userId === ownerId)
      throw new AppError(
        409,
        "CLUB_OWNER_PROTECTED",
        "Owner membership cannot be replaced",
      );
    if (
      input.permissions.some(
        (p) => !STAFF_PERMISSIONS[input.role].includes(p as never),
      )
    )
      throw new AppError(
        400,
        "CLUB_PERMISSION_INVALID",
        "Permission exceeds this role",
      );
    const membership = await this.memberships.findOneAndUpdate(
      { clubId: oid(clubId), userId: oid(userId) },
      {
        $set: {
          role: input.role,
          permissions: [...new Set(input.permissions)],
          status: "invited",
          invitedBy: oid(ownerId),
        },
        $unset: { acceptedAt: "" },
        $push: {
          changes: {
            action: "invite",
            actorId: ownerId,
            at: new Date(),
            role: input.role,
            permissions: input.permissions,
          },
        },
      },
      { upsert: true, new: true },
    );
    return publicMembership(membership);
  }

  async decide(
    userId: string,
    membershipId: string,
    status: "accepted" | "rejected",
  ) {
    const membership = await this.memberships.findOneAndUpdate(
      { _id: oid(membershipId), userId: oid(userId), status: "invited" },
      {
        $set: {
          status,
          ...(status === "accepted" ? { acceptedAt: new Date() } : {}),
        },
        $push: {
          changes: {
            action: status === "accepted" ? "accept" : "reject",
            actorId: userId,
            at: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!membership)
      throw new AppError(
        404,
        "CLUB_MEMBERSHIP_NOT_FOUND",
        "Club invitation not found",
      );
    return publicMembership(membership);
  }

  async revoke(ownerId: string, clubId: string, membershipId: string) {
    await this.clubs.findForOwner(ownerId, clubId);
    const item = await this.memberships.findOneAndUpdate(
      {
        _id: oid(membershipId),
        clubId: oid(clubId),
        userId: { $ne: oid(ownerId) },
        role: { $ne: "owner" },
        status: { $ne: "suspended" },
      },
      {
        $set: { status: "suspended" },
        $push: {
          changes: { action: "revoke", actorId: ownerId, at: new Date() },
        },
      },
      { new: true },
    );
    if (item) return publicMembership(item);
    const existing = await this.memberships.findOne({
      _id: oid(membershipId),
      clubId: oid(clubId),
      userId: { $ne: oid(ownerId) },
      role: { $ne: "owner" },
      status: "suspended",
    });
    if (!existing)
      throw new AppError(
        404,
        "CLUB_MEMBERSHIP_NOT_FOUND",
        "Membership not found",
      );
    return publicMembership(existing);
  }

  async invitation(userId: string, membershipId: string) {
    const item = await this.memberships.findOne({
      _id: oid(membershipId),
      userId: oid(userId),
    });
    if (!item)
      throw new AppError(
        404,
        "CLUB_MEMBERSHIP_NOT_FOUND",
        "Invitation not found",
      );
    const club = await this.clubs.findById(String(item.clubId));
    return { ...publicMembership(item), clubName: club.name };
  }

  async assertAccepted(
    clubId: string,
    userId: string,
    role?: ClubMembershipDocument["role"],
  ) {
    const membership = await this.memberships.exists({
      clubId: oid(clubId),
      userId: oid(userId),
      status: "accepted",
      ...(role ? { role } : {}),
    });
    if (!membership)
      throw new AppError(
        403,
        "CLUB_MEMBERSHIP_REQUIRED",
        "Accepted club membership is required",
      );
  }
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
  return new Types.ObjectId(value);
}
function publicMembership(item: ClubMembershipDocument) {
  return {
    id: String(item._id),
    clubId: String(item.clubId),
    userId: String(item.userId),
    coachId: item.coachId ? String(item.coachId) : undefined,
    role: item.role,
    permissions: effectiveClubPermissions(item.role, item.permissions),
    changes: item.changes ?? [],
    status: item.status,
    invitedBy: String(item.invitedBy),
    acceptedAt: item.acceptedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}
