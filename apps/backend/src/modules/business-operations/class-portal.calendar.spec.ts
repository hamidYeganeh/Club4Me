import { Types } from "mongoose";

import { BusinessClassPortalService } from "./class-portal.service";

describe("BusinessClassPortalService calendar feeds", () => {
  it("revokes a club feed without rotating its token", async () => {
    const userId = new Types.ObjectId();
    const clubId = new Types.ObjectId();
    const calendarFeeds = {
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const clubs = { findForOwner: jest.fn() };
    const service = new BusinessClassPortalService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      calendarFeeds as never,
      {} as never,
      {} as never,
      {} as never,
      clubs as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.revokeClubCalendarFeed(
      String(userId),
      String(clubId),
    );

    expect(result).toEqual({ revoked: true });
    expect(clubs.findForOwner).toHaveBeenCalledWith(
      String(userId),
      String(clubId),
    );
    expect(calendarFeeds.updateOne).toHaveBeenCalledWith(
      {
        scopeType: "club",
        scopeId: clubId,
        createdBy: userId,
        isActive: true,
      },
      { $set: { isActive: false } },
    );
  });
});
