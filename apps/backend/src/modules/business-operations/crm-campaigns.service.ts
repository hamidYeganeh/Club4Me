import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import { ClubsRepository } from "../clubs/clubs.repository";
import { NotificationsService } from "../notifications/notifications.service";

export type CreateCrmCampaign = {
  title: string;
  body: string;
  scheduledAt: string;
  kind: "push" | "news";
  audience: "all_students" | "selected_students";
  studentIds: string[];
};
export type AudienceFilter = {
  kind:
    | "all"
    | "membership_expiring"
    | "inactive"
    | "reservation_date"
    | "discount_unused";
  days?: number;
  date?: string;
  discountId?: string;
};
type Campaign = {
  _id: Types.ObjectId;
  clubId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  body: string;
  scheduledAt: Date;
  kind?: "push" | "news";
  audience: CreateCrmCampaign["audience"];
  studentIds: Types.ObjectId[];
  status:
    "pending" | "approved" | "processing" | "sent" | "published" | "rejected";
  approvedBy?: Types.ObjectId;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CrmCampaignsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrmCampaignsService.name);
  private timer?: ReturnType<typeof setInterval>;
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly clubs: ClubsRepository,
    private readonly notifications: NotificationsService,
  ) {}
  private get campaigns() {
    return this.connection.collection<Campaign>("club_crm_campaigns");
  }
  onModuleInit() {
    void this.campaigns
      .createIndex({ status: 1, scheduledAt: 1 })
      .catch((error) =>
        this.logger.error(
          `CRM campaign index creation failed: ${String(error)}`,
        ),
      );
    this.timer = setInterval(() => void this.dispatchDue(), 30_000);
    void this.dispatchDue();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private publicItem(item: Campaign) {
    return {
      id: String(item._id),
      clubId: String(item.clubId),
      title: item.title,
      body: item.body,
      kind: item.kind ?? "push",
      scheduledAt: item.scheduledAt.toISOString(),
      audience: item.audience,
      studentIds: item.studentIds.map(String),
      status: item.status,
      sentAt: item.sentAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
  async listForClub(userId: string, clubId: string) {
    await this.clubs.findForOwner(userId, clubId, "students.read");
    const items = await this.campaigns
      .find({ clubId: new Types.ObjectId(clubId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return { items: items.map((item) => this.publicItem(item)) };
  }
  async create(userId: string, clubId: string, input: CreateCrmCampaign) {
    await this.clubs.findForOwner(userId, clubId, "students.write");
    if (input.kind === "push" && new Date(input.scheduledAt) <= new Date())
      throw new AppError(
        400,
        "INVALID_SCHEDULE",
        "Schedule must be in the future",
      );
    const studentIds =
      input.kind === "push" && input.audience === "selected_students"
        ? input.studentIds.map((id) => new Types.ObjectId(id))
        : [];
    if (input.kind === "push" && input.audience === "selected_students") {
      const count = await this.connection
        .collection("club_students")
        .countDocuments({
          _id: { $in: studentIds },
          clubId: new Types.ObjectId(clubId),
          status: "active",
          userId: { $type: "objectId" },
        });
      if (!studentIds.length || count !== studentIds.length)
        throw new AppError(
          400,
          "INVALID_AUDIENCE",
          "Students must belong to club",
        );
    }
    const now = new Date();
    const item: Campaign = {
      _id: new Types.ObjectId(),
      clubId: new Types.ObjectId(clubId),
      createdBy: new Types.ObjectId(userId),
      title: input.title,
      body: input.body,
      kind: input.kind,
      scheduledAt: new Date(input.scheduledAt),
      audience: input.kind === "news" ? "all_students" : input.audience,
      studentIds,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    await this.campaigns.insertOne(item);
    return this.publicItem(item);
  }
  async update(
    userId: string,
    clubId: string,
    id: string,
    input: CreateCrmCampaign,
  ) {
    await this.clubs.findForOwner(userId, clubId, "students.write");
    if (!Types.ObjectId.isValid(id))
      throw new AppError(404, "CAMPAIGN_NOT_FOUND", "Campaign not found");
    const existing = await this.campaigns.findOne({
      _id: new Types.ObjectId(id),
      clubId: new Types.ObjectId(clubId),
    });
    if (!existing)
      throw new AppError(404, "CAMPAIGN_NOT_FOUND", "Campaign not found");
    if (!["pending", "rejected", "published"].includes(existing.status))
      throw new AppError(
        409,
        "CAMPAIGN_LOCKED",
        "Campaign cannot be edited now",
      );
    // Use the same audience and schedule validation as creation before replacing the draft.
    if (input.kind === "push" && new Date(input.scheduledAt) <= new Date())
      throw new AppError(
        400,
        "INVALID_SCHEDULE",
        "Schedule must be in the future",
      );
    const studentIds =
      input.kind === "push" && input.audience === "selected_students"
        ? input.studentIds.map((value) => new Types.ObjectId(value))
        : [];
    if (input.kind === "push" && input.audience === "selected_students") {
      const count = await this.connection
        .collection("club_students")
        .countDocuments({
          _id: { $in: studentIds },
          clubId: new Types.ObjectId(clubId),
          status: "active",
          userId: { $type: "objectId" },
        });
      if (!studentIds.length || count !== studentIds.length)
        throw new AppError(
          400,
          "INVALID_AUDIENCE",
          "Students must belong to club",
        );
    }
    const updated = await this.campaigns.findOneAndUpdate(
      { _id: existing._id, status: existing.status },
      {
        $set: {
          title: input.title,
          body: input.body,
          kind: input.kind,
          scheduledAt: new Date(input.scheduledAt),
          audience: input.kind === "news" ? "all_students" : input.audience,
          studentIds,
          status: "pending",
          updatedAt: new Date(),
        },
        $unset: { approvedBy: "", sentAt: "" },
      },
      { returnDocument: "after" },
    );
    if (!updated)
      throw new AppError(
        409,
        "CAMPAIGN_CHANGED",
        "Campaign changed during editing",
      );
    return this.publicItem(updated);
  }
  async publicNews(clubId: string) {
    await this.clubs.findPublic(clubId);
    const items = await this.campaigns
      .find({
        clubId: new Types.ObjectId(clubId),
        kind: "news",
        status: "published",
        scheduledAt: { $lte: new Date() },
      })
      .sort({ scheduledAt: -1 })
      .limit(30)
      .toArray();
    return { items: items.map((item) => this.publicItem(item)) };
  }
  async previewAudience(
    userId: string,
    clubId: string,
    filter: AudienceFilter,
  ) {
    await this.clubs.findForOwner(userId, clubId, "students.read");
    const club = new Types.ObjectId(clubId);
    const now = new Date();
    const students = await this.connection
      .collection<{
        _id: Types.ObjectId;
        userId: Types.ObjectId | null;
        firstName: string;
        lastName: string;
        membershipEndsAt: Date | null;
        createdAt: Date;
        status: string;
      }>("club_students")
      .find({ clubId: club, status: "active", userId: { $type: "objectId" } })
      .limit(5000)
      .toArray();
    let matched = students;
    if (filter.kind === "membership_expiring") {
      const until = new Date(now.getTime() + (filter.days ?? 7) * 86_400_000);
      matched = students.filter(
        (s) =>
          s.membershipEndsAt &&
          s.membershipEndsAt >= now &&
          s.membershipEndsAt <= until,
      );
    } else if (filter.kind === "inactive") {
      const cutoff = new Date(now.getTime() - (filter.days ?? 30) * 86_400_000);
      const [manual, classes, bookings] = await Promise.all([
        this.connection.collection("club_attendance").distinct("studentId", {
          clubId: club,
          status: "present",
          date: { $gte: cutoff },
        }),
        this.connection
          .collection("business_class_attendance")
          .distinct("studentId", {
            clubId: club,
            status: "present",
            $or: [
              { checkedInAt: { $gte: cutoff } },
              { updatedAt: { $gte: cutoff } },
            ],
          }),
        this.connection
          .collection("session_reservations")
          .distinct("userId", { clubId: club, checkedInAt: { $gte: cutoff } }),
      ]);
      const present = new Set([...manual, ...classes].map(String));
      const booked = new Set(bookings.map(String));
      matched = students.filter(
        (s) =>
          s.createdAt <= cutoff &&
          !present.has(String(s._id)) &&
          !booked.has(String(s.userId)),
      );
    } else if (filter.kind === "reservation_date") {
      const from = new Date(`${filter.date}T00:00:00+03:30`);
      const to = new Date(from.getTime() + 86_400_000);
      const booked = await this.connection
        .collection("session_reservations")
        .distinct("userId", {
          clubId: club,
          status: "reserved",
          sessionStartsAt: { $gte: from, $lt: to },
        });
      const ids = new Set(booked.map(String));
      matched = students.filter((s) => ids.has(String(s.userId)));
    } else if (filter.kind === "discount_unused") {
      const discount = await this.connection
        .collection("discount_campaigns")
        .findOne({ _id: new Types.ObjectId(filter.discountId), clubIds: club });
      if (!discount)
        throw new AppError(
          404,
          "DISCOUNT_NOT_FOUND",
          "Discount not found for club",
        );
      const redeemed = await this.connection
        .collection("discount_redemptions")
        .distinct("userId", {
          campaignId: discount._id,
          status: { $in: ["reserved", "consumed"] },
        });
      const used = new Set(redeemed.map(String));
      matched = students.filter((s) => !used.has(String(s.userId)));
    }
    return {
      items: matched.slice(0, 1000).map((s) => ({
        id: String(s._id),
        firstName: s.firstName,
        lastName: s.lastName,
      })),
      total: matched.length,
    };
  }
  async listForAdmin() {
    const items = await this.campaigns
      .find()
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    return { items: items.map((item) => this.publicItem(item)) };
  }
  async review(id: string, approved: boolean, adminId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new AppError(404, "CAMPAIGN_NOT_FOUND", "Campaign not found");
    const item = await this.campaigns.findOneAndUpdate(
      { _id: new Types.ObjectId(id), status: "pending" },
      {
        $set: {
          status: approved ? "approved" : "rejected",
          approvedBy: new Types.ObjectId(adminId),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    if (!item)
      throw new AppError(
        409,
        "CAMPAIGN_NOT_PENDING",
        "Campaign is not pending review",
      );
    if (approved) void this.dispatchDue();
    return this.publicItem(item);
  }
  async dispatchDue() {
    try {
      await this.campaigns.updateMany(
        {
          status: "processing",
          updatedAt: { $lt: new Date(Date.now() - 5 * 60_000) },
        },
        { $set: { status: "approved", updatedAt: new Date() } },
      );
      for (let i = 0; i < 20; i++) {
        const item = await this.campaigns.findOneAndUpdate(
          { status: "approved", scheduledAt: { $lte: new Date() } },
          { $set: { status: "processing", updatedAt: new Date() } },
          { returnDocument: "after" },
        );
        if (!item) break;
        try {
          if (item.kind === "news") {
            await this.campaigns.updateOne(
              { _id: item._id },
              {
                $set: {
                  status: "published",
                  sentAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            );
            continue;
          }
          const filter = {
            clubId: item.clubId,
            status: "active",
            userId: { $type: "objectId" },
            ...(item.audience === "selected_students"
              ? { _id: { $in: item.studentIds } }
              : {}),
          };
          const userIds = (await this.connection
            .collection("club_students")
            .distinct("userId", filter)) as Types.ObjectId[];
          await this.notifications.notifyCrmCampaign({
            campaignId: item._id,
            userIds,
            title: item.title,
            body: item.body,
            clubId: String(item.clubId),
          });
          await this.campaigns.updateOne(
            { _id: item._id },
            {
              $set: {
                status: "sent",
                sentAt: new Date(),
                updatedAt: new Date(),
              },
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to dispatch CRM campaign ${item._id}: ${String(error)}`,
          );
          await this.campaigns.updateOne(
            { _id: item._id },
            { $set: { status: "approved", updatedAt: new Date() } },
          );
          break;
        }
      }
    } catch (error) {
      this.logger.error(`CRM campaign dispatch failed: ${String(error)}`);
    }
  }
}
