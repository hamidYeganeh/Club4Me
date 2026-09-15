import { type ClientSession, type Connection, Types } from "mongoose";

/** Serializes quota checks across API instances; MongoDB retries write conflicts. */
export async function userFeatureWrite<T>(
  db: Connection,
  userId: string,
  feature: string,
  write: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await db.startSession();
  try {
    return await session.withTransaction(async () => {
      await db
        .collection<{ _id: string; userId: Types.ObjectId; revision: number }>(
          "user_feature_locks",
        )
        .updateOne(
          { _id: `${userId}:${feature}` },
          {
            $inc: { revision: 1 },
            $setOnInsert: { userId: new Types.ObjectId(userId) },
          },
          { upsert: true, session },
        );
      return write(session);
    });
  } finally {
    await session.endSession();
  }
}
