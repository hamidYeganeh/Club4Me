import { Types, type Connection } from "mongoose";
import { CrmCampaignsService } from "./crm-campaigns.service";
import type { ClubsRepository } from "../clubs/clubs.repository";
import type { NotificationsService } from "../notifications/notifications.service";

describe("CrmCampaignsService", () => {
  it("does not send campaigns awaiting admin approval", async () => {
    const campaigns = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    };
    const connection = {
      collection: jest.fn().mockReturnValue(campaigns),
    } as unknown as Connection;
    const notifications = { notifyCrmCampaign: jest.fn() };
    const service = new CrmCampaignsService(
      connection,
      {} as ClubsRepository,
      notifications as unknown as NotificationsService,
    );

    await service.dispatchDue();

    expect(campaigns.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" }),
      expect.anything(),
      expect.anything(),
    );
    expect(notifications.notifyCrmCampaign).not.toHaveBeenCalled();
  });

  it("sends an approved campaign only after its scheduled time", async () => {
    const campaignId = new Types.ObjectId();
    const clubId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const item = {
      _id: campaignId,
      clubId,
      title: "خبر باشگاه",
      body: "برنامه جدید",
      audience: "all_students",
      studentIds: [],
    };
    const campaigns = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(null),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const students = { distinct: jest.fn().mockResolvedValue([userId]) };
    const connection = {
      collection: jest.fn((name: string) =>
        name === "club_crm_campaigns" ? campaigns : students,
      ),
    } as unknown as Connection;
    const notifications = {
      notifyCrmCampaign: jest.fn().mockResolvedValue(undefined),
    };
    const service = new CrmCampaignsService(
      connection,
      {} as ClubsRepository,
      notifications as unknown as NotificationsService,
    );

    await service.dispatchDue();

    expect(campaigns.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        scheduledAt: expect.objectContaining({ $lte: expect.any(Date) }),
      }),
      expect.anything(),
      expect.anything(),
    );
    expect(students.distinct).toHaveBeenCalledWith(
      "userId",
      expect.objectContaining({ clubId, status: "active" }),
    );
    expect(notifications.notifyCrmCampaign).toHaveBeenCalledWith({
      campaignId,
      userIds: [userId],
      title: item.title,
      body: item.body,
      clubId: String(clubId),
    });
    expect(campaigns.updateOne).toHaveBeenCalledWith(
      { _id: campaignId },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "sent" }),
      }),
    );
  });

  it("publishes an approved news item without sending a push", async () => {
    const item = {
      _id: new Types.ObjectId(),
      kind: "news",
      clubId: new Types.ObjectId(),
    };
    const campaigns = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(null),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const connection = {
      collection: jest.fn().mockReturnValue(campaigns),
    } as unknown as Connection;
    const notifications = { notifyCrmCampaign: jest.fn() };
    const service = new CrmCampaignsService(
      connection,
      {} as ClubsRepository,
      notifications as unknown as NotificationsService,
    );

    await service.dispatchDue();

    expect(campaigns.updateOne).toHaveBeenCalledWith(
      { _id: item._id },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "published" }),
      }),
    );
    expect(notifications.notifyCrmCampaign).not.toHaveBeenCalled();
  });

  it("previews only students with a reservation on the selected date", async () => {
    const clubId = new Types.ObjectId();
    const bookedUser = new Types.ObjectId();
    const otherUser = new Types.ObjectId();
    const students = [
      {
        _id: new Types.ObjectId(),
        userId: bookedUser,
        firstName: "آوا",
        lastName: "الف",
      },
      {
        _id: new Types.ObjectId(),
        userId: otherUser,
        firstName: "نیما",
        lastName: "ب",
      },
    ];
    const find = jest
      .fn()
      .mockReturnValue({ limit: () => ({ toArray: async () => students }) });
    const distinct = jest.fn().mockResolvedValue([bookedUser]);
    const connection = {
      collection: jest.fn((name: string) =>
        name === "club_students" ? { find } : { distinct },
      ),
    } as unknown as Connection;
    const clubs = { findForOwner: jest.fn().mockResolvedValue({}) };
    const service = new CrmCampaignsService(
      connection,
      clubs as unknown as ClubsRepository,
      {} as NotificationsService,
    );

    const result = await service.previewAudience(
      new Types.ObjectId().toHexString(),
      clubId.toHexString(),
      {
        kind: "reservation_date",
        date: "2026-09-16",
      },
    );

    expect(result).toEqual({
      items: [
        { id: String(students[0]!._id), firstName: "آوا", lastName: "الف" },
      ],
      total: 1,
    });
    expect(distinct).toHaveBeenCalledWith(
      "userId",
      expect.objectContaining({
        clubId,
        status: "reserved",
        sessionStartsAt: {
          $gte: new Date("2026-09-15T20:30:00.000Z"),
          $lt: new Date("2026-09-16T20:30:00.000Z"),
        },
      }),
    );
  });

  it("only exposes published news for a public club", async () => {
    const clubId = new Types.ObjectId().toHexString();
    const toArray = jest.fn().mockResolvedValue([]);
    const find = jest
      .fn()
      .mockReturnValue({ sort: () => ({ limit: () => ({ toArray }) }) });
    const clubs = { findPublic: jest.fn().mockResolvedValue({}) };
    const connection = {
      collection: jest.fn().mockReturnValue({ find }),
    } as unknown as Connection;
    const service = new CrmCampaignsService(
      connection,
      clubs as unknown as ClubsRepository,
      {} as NotificationsService,
    );

    await service.publicNews(clubId);

    expect(clubs.findPublic).toHaveBeenCalledWith(clubId);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        clubId: new Types.ObjectId(clubId),
        kind: "news",
        status: "published",
        scheduledAt: { $lte: expect.any(Date) },
      }),
    );
  });

  it("allows an immediate news item to wait for admin approval", async () => {
    const insertOne = jest.fn().mockResolvedValue({ acknowledged: true });
    const connection = {
      collection: jest.fn().mockReturnValue({ insertOne }),
    } as unknown as Connection;
    const clubs = { findForOwner: jest.fn().mockResolvedValue({}) };
    const service = new CrmCampaignsService(
      connection,
      clubs as unknown as ClubsRepository,
      {} as NotificationsService,
    );
    const result = await service.create(
      new Types.ObjectId().toHexString(),
      new Types.ObjectId().toHexString(),
      {
        title: "تعطیلی امروز",
        body: "باشگاه امروز تعطیل است",
        scheduledAt: "2026-01-01T09:00:00.000Z",
        kind: "news",
        audience: "all_students",
        studentIds: [],
      },
    );

    expect(result.status).toBe("pending");
    expect(result.kind).toBe("news");
    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", kind: "news" }),
    );
  });
});
