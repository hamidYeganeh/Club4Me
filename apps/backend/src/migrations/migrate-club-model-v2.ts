import { config as loadDotenv } from "dotenv";
import mongoose, { Types } from "mongoose";

async function migrate(): Promise<void> {
  loadDotenv({ path: ".env" });
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is required");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is unavailable");
  const clubs = db.collection<Record<string, unknown>>("clubs");
  const memberships = db.collection("club_memberships");
  const cursor = clubs.find({ schemaVersion: { $ne: 2 } });
  for await (const club of cursor) {
    const gallery = asRecords(club.gallery).map((item, position) => ({
      ...item,
      kind: item.kind ?? "image",
      position: item.position ?? position,
      isCover: item.isCover ?? position === 0,
    }));
    const equipment = asRecords(club.equipment).map((item) => ({
      ...item,
      reservableQuantity: item.reservableQuantity ?? 0,
      status: item.status ?? "available",
    }));
    const amenities = asRecords(club.amenities).map((item) => ({
      ...item,
      availability: item.availability ?? "included",
    }));
    const cancellationRules = asRecords(club.cancellationRules).map((item) => ({
      ...item,
      _id: item._id ?? new Types.ObjectId(),
      version: item.version ?? 1,
      priority: item.priority ?? 0,
      sessionTypes: item.sessionTypes ?? [],
      daysOfWeek: item.daysOfWeek ?? [],
      courtIds: item.courtIds ?? [],
      reservationCutoffMinutes: item.reservationCutoffMinutes ?? 0,
      rescheduleCutoffMinutes: item.rescheduleCutoffMinutes ?? 0,
      noShowRefundPercent: item.noShowRefundPercent ?? 0,
      ownerCancellationRefundPercent:
        item.ownerCancellationRefundPercent ?? 100,
      isActive: item.isActive ?? true,
    }));
    await clubs.updateOne(
      { _id: club._id },
      {
        $set: {
          shortDescription: club.shortDescription ?? "",
          gallery,
          equipment,
          amenities,
          cancellationRules,
          sportIds: club.sportIds ?? [],
          postalCode: club.postalCode ?? "",
          timezone: club.timezone ?? "Asia/Tehran",
          locationNotes: club.locationNotes ?? "",
          weeklyHours: club.weeklyHours ?? [],
          closures: club.closures ?? [],
          audience: club.audience ?? ["mixed"],
          currency: club.currency ?? "IRR",
          taxPercent: club.taxPercent ?? 0,
          averageRating: club.averageRating ?? 0,
          reviewsCount: club.reviewsCount ?? 0,
          operationalStatus: club.operationalStatus ?? "active",
          createdBy: club.createdBy ?? club.ownerId,
          updatedBy: club.updatedBy ?? club.ownerId,
          schemaVersion: 2,
        },
      },
    );
    if (club.ownerId) {
      await memberships.updateOne(
        { clubId: club._id, userId: club.ownerId },
        {
          $setOnInsert: {
            role: "owner",
            permissions: ["*"],
            status: "accepted",
            invitedBy: club.ownerId,
            acceptedAt: club.createdAt ?? new Date(),
            createdAt: club.createdAt ?? new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }
  }
  await db
    .collection("courts")
    .updateMany({ normalizedName: { $exists: false } }, [
      {
        $set: {
          normalizedName: { $toLower: { $trim: { input: "$name" } } },
          sportIds: { $ifNull: ["$sportIds", []] },
          environment: { $ifNull: ["$environment", "indoor"] },
          galleryMediaIds: { $ifNull: ["$galleryMediaIds", []] },
          minimumReservationMinutes: {
            $ifNull: ["$minimumReservationMinutes", 60],
          },
          maximumReservationMinutes: {
            $ifNull: ["$maximumReservationMinutes", 480],
          },
          preparationMinutes: { $ifNull: ["$preparationMinutes", 0] },
          cleanupMinutes: { $ifNull: ["$cleanupMinutes", 0] },
        },
      },
    ]);
  await db
    .collection("classes")
    .updateMany({ clubApprovalStatus: { $exists: false } }, [
      {
        $set: {
          galleryMediaIds: { $ifNull: ["$galleryMediaIds", []] },
          tags: { $ifNull: ["$tags", []] },
          prerequisites: { $ifNull: ["$prerequisites", []] },
          requiredEquipmentIds: { $ifNull: ["$requiredEquipmentIds", []] },
          amenityIds: { $ifNull: ["$amenityIds", []] },
          clubApprovalStatus: {
            $cond: [
              { $ne: [{ $ifNull: ["$clubId", null] }, null] },
              "pending",
              "not_required",
            ],
          },
        },
      },
    ]);
  await mongoose.disconnect();
}

function asRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
    : [];
}

migrate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
