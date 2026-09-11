import type { Connection } from "mongoose";
import { Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import {
  toE164IranianPhone,
  toLocalIranianPhone,
} from "../../common/utils/phone.util";

/** Club permissions do not grant coaches access to another coach's students. */
export async function coachClassScope(
  connection: Connection,
  userId: string,
  clubId: string,
) {
  const user = new Types.ObjectId(userId);
  const club = new Types.ObjectId(clubId);
  if (
    await connection.collection("clubs").findOne({ _id: club, ownerId: user })
  )
    return {};
  const membership = await connection.collection("club_memberships").findOne({
    clubId: club,
    userId: user,
    status: "accepted",
  });
  // The caller must first assert the operation's club permission.
  if (membership?.role !== "coach") return {};
  const account = await connection.collection("users").findOne({ _id: user });
  const profiles = await connection
    .collection("club_coach_profiles")
    .find({
      clubId: club,
      status: "active",
      $or: [
        { userId: user },
        ...(account?.phone
          ? [
              {
                userId: null,
                phone: {
                  $in: [
                    account.phone,
                    toE164IranianPhone(account.phone),
                    toLocalIranianPhone(account.phone),
                  ],
                },
              },
            ]
          : []),
      ],
    })
    .toArray();
  return { coachProfileId: { $in: profiles.map((profile) => profile._id) } };
}

export async function assertCoachClassScope(
  connection: Connection,
  userId: string,
  clubId: string,
  classId: string,
) {
  const scope = await coachClassScope(connection, userId, clubId);
  if (!("coachProfileId" in scope)) return;
  if (
    !(await connection.collection("business_training_classes").findOne({
      _id: new Types.ObjectId(classId),
      clubId: new Types.ObjectId(clubId),
      ...scope,
    }))
  )
    throw new AppError(
      403,
      "CLASS_ASSIGNMENT_REQUIRED",
      "Only assigned classes are permitted",
    );
}
