import type { Document, Filter, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import { getDb } from "../db/mongodb.js";
import { AppError } from "../lib/errors.js";
import { idOf, iso, toObjectId } from "../lib/http.js";

export type ClubRecord = {
  name: string;
  slug: string;
  city?: string;
  description?: string;
  ownerId: string | ObjectId;
  reviewStatus?: "draft" | "pending" | "approved" | "rejected";
  visibility?: "hidden" | "public";
  location?: { type: "Point"; coordinates: [number, number] };
  createdAt: Date;
  updatedAt: Date;
};

export type PublicClub = {
  id: string;
  name: string;
  slug: string;
  city?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClassRecord = {
  clubId: ObjectId;
  name: string;
  sport?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicClass = {
  id: string;
  clubId: string;
  name: string;
  sport?: string;
  createdAt: string;
  updatedAt: string;
};

export type SlotRecord = {
  clubId: ObjectId;
  classId?: ObjectId;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  reservedCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicSlot = {
  id: string;
  clubId: string;
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedCount: number;
};

export type ReservationRecord = {
  clubId: ObjectId;
  slotId: ObjectId;
  userId: string;
  participantCount: number;
  status: "reserved";
  createdAt: Date;
};

export type PublicReservation = {
  id: string;
  clubId: string;
  slotId: string;
  userId: string;
  participantCount: number;
  status: "reserved";
  createdAt: string;
};

function clubs() {
  return getDb().collection<ClubRecord>("clubs");
}

function classes() {
  return getDb().collection<ClassRecord>("classes");
}

function slots() {
  return getDb().collection<SlotRecord>("slots");
}

function reservations() {
  return getDb().collection<ReservationRecord>("reservations");
}

export async function ensureDiscoveryIndexes(): Promise<void> {
  await clubs().createIndex({ slug: 1 }, { unique: true });
  await clubs().createIndex({ city: 1, createdAt: -1 });
  await clubs().createIndex({ location: "2dsphere" });
  await classes().createIndex({ clubId: 1, createdAt: -1 });
  await slots().createIndex({ clubId: 1, startsAt: 1 });
  await reservations().createIndex({ slotId: 1, userId: 1 });
}

function slugBase(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return slug || "club";
}

function serializeClub(club: WithId<ClubRecord>): PublicClub {
  return {
    id: idOf(club._id),
    name: club.name,
    slug: club.slug,
    ...(club.city === undefined ? {} : { city: club.city }),
    ...(club.description === undefined
      ? {}
      : { description: club.description }),
    createdAt: iso(club.createdAt),
    updatedAt: iso(club.updatedAt),
  };
}

function serializeClass(item: WithId<ClassRecord>): PublicClass {
  return {
    id: idOf(item._id),
    clubId: idOf(item.clubId),
    name: item.name,
    ...(item.sport === undefined ? {} : { sport: item.sport }),
    createdAt: iso(item.createdAt),
    updatedAt: iso(item.updatedAt),
  };
}

function serializeSlot(slot: WithId<SlotRecord>): PublicSlot {
  return {
    id: idOf(slot._id),
    clubId: idOf(slot.clubId),
    ...(slot.classId === undefined ? {} : { classId: idOf(slot.classId) }),
    startsAt: iso(slot.startsAt),
    endsAt: iso(slot.endsAt),
    capacity: slot.capacity,
    reservedCount: slot.reservedCount,
  };
}

function serializeReservation(
  reservation: WithId<ReservationRecord>,
): PublicReservation {
  return {
    id: idOf(reservation._id),
    clubId: idOf(reservation.clubId),
    slotId: idOf(reservation.slotId),
    userId: reservation.userId,
    participantCount: reservation.participantCount,
    status: reservation.status,
    createdAt: iso(reservation.createdAt),
  };
}

export async function listClubs(input: {
  city?: string;
  q?: string;
  latitude?: number;
  longitude?: number;
  page: number;
  limit: number;
}): Promise<{
  items: PublicClub[];
  page: number;
  limit: number;
  total: number;
}> {
  const filter: Filter<ClubRecord> = {
    reviewStatus: "approved",
    visibility: "public",
  };

  if (input.city) {
    filter.city = input.city;
  }

  if (input.q) {
    filter.name = { $regex: input.q, $options: "i" };
  }

  const countFilter: Filter<ClubRecord> = { ...filter };

  if (input.latitude !== undefined && input.longitude !== undefined) {
    countFilter.location = { $exists: true };
    filter.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [input.longitude, input.latitude],
        },
      },
    };
  }

  const skip = (input.page - 1) * input.limit;
  const [items, total] = await Promise.all([
    clubs()
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .toArray(),
    clubs().countDocuments(countFilter),
  ]);

  return {
    items: items.map(serializeClub),
    page: input.page,
    limit: input.limit,
    total,
  };
}

export async function getClub(clubId: string): Promise<PublicClub> {
  const club = await clubs().findOne({
    _id: toObjectId(clubId, "clubId"),
    reviewStatus: "approved",
    visibility: "public",
  });

  if (!club) {
    throw new AppError(404, "CLUB_NOT_FOUND", "Club not found");
  }

  return serializeClub(club);
}

export async function createClub(input: {
  name: string;
  city?: string;
  description?: string;
  ownerId: string;
}): Promise<PublicClub> {
  const now = new Date();
  const tempId = new ObjectId();
  const record: ClubRecord = {
    name: input.name,
    slug: `${slugBase(input.name)}-${tempId.toHexString().slice(-6)}`,
    ...(input.city === undefined ? {} : { city: input.city }),
    ...(input.description === undefined
      ? {}
      : { description: input.description }),
    ownerId: input.ownerId,
    reviewStatus: "draft",
    visibility: "hidden",
    createdAt: now,
    updatedAt: now,
  };

  await clubs().insertOne({ _id: tempId, ...record } as ClubRecord & {
    _id: ObjectId;
  } & Document);

  return serializeClub({ _id: tempId, ...record });
}

export async function listClasses(clubId: string): Promise<PublicClass[]> {
  await getClub(clubId);

  const items = await classes()
    .find({ clubId: toObjectId(clubId, "clubId") })
    .sort({ createdAt: -1 })
    .toArray();

  return items.map(serializeClass);
}

export async function createClass(input: {
  clubId: string;
  ownerId: string;
  name: string;
  sport?: string;
}): Promise<PublicClass> {
  await assertClubOwner(input.clubId, input.ownerId);

  const now = new Date();
  const record: ClassRecord = {
    clubId: toObjectId(input.clubId, "clubId"),
    name: input.name,
    ...(input.sport === undefined ? {} : { sport: input.sport }),
    createdAt: now,
    updatedAt: now,
  };

  const result = await classes().insertOne(record as ClassRecord & Document);

  return serializeClass({ _id: result.insertedId, ...record });
}

export async function listSlots(clubId: string): Promise<PublicSlot[]> {
  await getClub(clubId);

  const items = await slots()
    .find({ clubId: toObjectId(clubId, "clubId") })
    .sort({ startsAt: 1 })
    .toArray();

  return items.map(serializeSlot);
}

export async function createSlot(input: {
  clubId: string;
  ownerId: string;
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}): Promise<PublicSlot> {
  await assertClubOwner(input.clubId, input.ownerId);

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  if (!(startsAt < endsAt)) {
    throw new AppError(400, "INVALID_SLOT", "Slot end must be after start");
  }

  if (input.classId) {
    const classDoc = await classes().findOne({
      _id: toObjectId(input.classId, "classId"),
      clubId: toObjectId(input.clubId, "clubId"),
    });

    if (!classDoc) {
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    }
  }

  const now = new Date();
  const record: SlotRecord = {
    clubId: toObjectId(input.clubId, "clubId"),
    ...(input.classId === undefined
      ? {}
      : { classId: toObjectId(input.classId, "classId") }),
    startsAt,
    endsAt,
    capacity: input.capacity,
    reservedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const result = await slots().insertOne(record as SlotRecord & Document);

  return serializeSlot({ _id: result.insertedId, ...record });
}

async function assertClubOwner(clubId: string, ownerId: string): Promise<void> {
  const ownerValues: Array<string | ObjectId> = [ownerId];
  if (ObjectId.isValid(ownerId)) ownerValues.push(new ObjectId(ownerId));
  const club = await clubs().findOne({
    _id: toObjectId(clubId, "clubId"),
    ownerId: { $in: ownerValues },
  });
  if (!club) {
    throw new AppError(404, "CLUB_NOT_FOUND", "Club not found");
  }
}

export async function reserveSlot(input: {
  clubId: string;
  slotId: string;
  userId: string;
  participantCount: number;
}): Promise<PublicReservation> {
  await getClub(input.clubId);

  const slotObjectId = toObjectId(input.slotId, "slotId");
  const clubObjectId = toObjectId(input.clubId, "clubId");

  const slot = await slots().findOne({
    _id: slotObjectId,
    clubId: clubObjectId,
  });

  if (!slot) {
    throw new AppError(404, "SLOT_NOT_FOUND", "Slot not found");
  }

  if (slot.reservedCount + input.participantCount > slot.capacity) {
    throw new AppError(409, "SLOT_FULL", "Not enough remaining capacity");
  }

  const updated = await slots().findOneAndUpdate(
    {
      _id: slotObjectId,
      clubId: clubObjectId,
      reservedCount: { $lte: slot.capacity - input.participantCount },
    },
    {
      $inc: { reservedCount: input.participantCount },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new AppError(409, "SLOT_FULL", "Not enough remaining capacity");
  }

  const now = new Date();
  const record: ReservationRecord = {
    clubId: clubObjectId,
    slotId: slotObjectId,
    userId: input.userId,
    participantCount: input.participantCount,
    status: "reserved",
    createdAt: now,
  };

  const result = await reservations().insertOne(
    record as ReservationRecord & Document,
  );

  return serializeReservation({ _id: result.insertedId, ...record });
}
