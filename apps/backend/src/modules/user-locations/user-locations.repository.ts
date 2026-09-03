import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import type { CreateUserLocationDto } from "./dto/create-user-location.dto";
import type { UpdateUserLocationDto } from "./dto/update-user-location.dto";
import {
  toPublicUserLocation,
  type PublicUserLocation,
} from "./mappers/user-location.mapper";
import {
  UserLocation,
  type UserLocationDocument,
} from "./schemas/user-location.schema";

@Injectable()
export class UserLocationsRepository {
  constructor(
    @InjectModel(UserLocation.name)
    private readonly model: Model<UserLocationDocument>,
  ) {}

  async list(userId: string): Promise<PublicUserLocation[]> {
    const items = await this.model
      .find({ userId: toObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
    return items.map(toPublicUserLocation);
  }

  count(userId: string): Promise<number> {
    return this.model.countDocuments({ userId: toObjectId(userId) }).exec();
  }

  async create(
    userId: string,
    input: CreateUserLocationDto,
  ): Promise<PublicUserLocation> {
    const ownerId = toObjectId(userId);
    for (let slot = 0; slot < 5; slot += 1) {
      try {
        const created = await this.model.create({
          userId: ownerId,
          title: input.title,
          geo: toGeo(input),
          address: input.address,
          location: toPoint(input.longitude, input.latitude),
          isDefault: false,
          slot,
        });
        return toPublicUserLocation(created);
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
      }
    }

    throw new AppError(
      409,
      "LOCATION_LIMIT_REACHED",
      "A user can have at most 5 locations",
    );
  }

  async update(
    userId: string,
    locationId: string,
    input: UpdateUserLocationDto,
  ): Promise<PublicUserLocation> {
    const current = await this.findOwnedDocument(userId, locationId);

    if (input.title !== undefined) current.title = input.title;
    if (input.address !== undefined) current.address = input.address;
    if (input.countryId !== undefined)
      current.geo.countryId = new Types.ObjectId(input.countryId);
    if (input.provinceId !== undefined)
      current.geo.provinceId = new Types.ObjectId(input.provinceId);
    if (input.cityId !== undefined)
      current.geo.cityId = new Types.ObjectId(input.cityId);
    if (input.districtId !== undefined)
      current.geo.districtId = input.districtId
        ? new Types.ObjectId(input.districtId)
        : null;
    if (input.cityRegionId !== undefined)
      current.geo.cityRegionId = input.cityRegionId
        ? new Types.ObjectId(input.cityRegionId)
        : null;
    if (input.longitude !== undefined)
      current.location.coordinates[0] = input.longitude;
    if (input.latitude !== undefined)
      current.location.coordinates[1] = input.latitude;

    current.markModified("geo");
    current.markModified("location");
    await current.save();
    return toPublicUserLocation(current);
  }

  async setDefault(
    userId: string,
    locationId: string,
  ): Promise<PublicUserLocation> {
    const ownerId = toObjectId(userId);
    const id = toLocationObjectId(locationId);
    const exists = await this.model.exists({ _id: id, userId: ownerId });
    if (!exists) throw locationNotFound();

    await this.model.updateMany(
      { userId: ownerId, isDefault: true, _id: { $ne: id } },
      { $set: { isDefault: false } },
    );
    let updated: UserLocationDocument | null;
    try {
      updated = await this.model.findOneAndUpdate(
        { _id: id, userId: ownerId },
        { $set: { isDefault: true } },
        { new: true },
      );
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      await this.model.updateMany(
        { userId: ownerId, isDefault: true, _id: { $ne: id } },
        { $set: { isDefault: false } },
      );
      updated = await this.model.findOneAndUpdate(
        { _id: id, userId: ownerId },
        { $set: { isDefault: true } },
        { new: true },
      );
    }
    if (!updated) throw locationNotFound();
    return toPublicUserLocation(updated);
  }

  async remove(
    userId: string,
    locationId: string,
  ): Promise<{ deletedWasDefault: boolean; remainingId?: string }> {
    const ownerId = toObjectId(userId);
    const deleted = await this.model.findOneAndDelete({
      _id: toLocationObjectId(locationId),
      userId: ownerId,
    });
    if (!deleted) throw locationNotFound();

    const remaining = deleted.isDefault
      ? await this.model.findOne({ userId: ownerId }).sort({ createdAt: 1 })
      : null;
    return {
      deletedWasDefault: deleted.isDefault,
      ...(remaining ? { remainingId: String(remaining._id) } : {}),
    };
  }

  private async findOwnedDocument(
    userId: string,
    locationId: string,
  ): Promise<UserLocationDocument> {
    const location = await this.model.findOne({
      _id: toLocationObjectId(locationId),
      userId: toObjectId(userId),
    });
    if (!location) throw locationNotFound();
    return location;
  }
}

function toGeo(input: CreateUserLocationDto) {
  return {
    countryId: new Types.ObjectId(input.countryId),
    provinceId: new Types.ObjectId(input.provinceId),
    cityId: new Types.ObjectId(input.cityId),
    districtId: input.districtId ? new Types.ObjectId(input.districtId) : null,
    cityRegionId: input.cityRegionId
      ? new Types.ObjectId(input.cityRegionId)
      : null,
  };
}

function toPoint(longitude: number, latitude: number) {
  return { type: "Point" as const, coordinates: [longitude, latitude] };
}

function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }
  return new Types.ObjectId(id);
}

function toLocationObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw locationNotFound();
  return new Types.ObjectId(id);
}

function locationNotFound(): AppError {
  return new AppError(404, "LOCATION_NOT_FOUND", "Location not found");
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
