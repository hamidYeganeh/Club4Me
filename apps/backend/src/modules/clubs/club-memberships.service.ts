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
    return { items: items.map(publicMembership) };
  }

  async invite(ownerId: string, clubId: string, input: InviteClubMemberDto) {
    await this.clubs.findForOwner(ownerId, clubId);
    const membership = await this.memberships.findOneAndUpdate(
      { clubId: oid(clubId), userId: oid(input.userId) },
      {
        $set: {
          role: input.role,
          permissions: [...new Set(input.permissions)],
          status: "invited",
          invitedBy: oid(ownerId),
        },
        $unset: { acceptedAt: "" },
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
    permissions: item.permissions,
    status: item.status,
    invitedBy: String(item.invitedBy),
    acceptedAt: item.acceptedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}
