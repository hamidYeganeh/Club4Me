import { Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import type { CreateUserLocationDto } from "./dto/create-user-location.dto";
import type { UpdateUserLocationDto } from "./dto/update-user-location.dto";
import type { PublicUserLocation } from "./mappers/user-location.mapper";
import { UserLocationsRepository } from "./user-locations.repository";

export const MAX_USER_LOCATIONS = 5;

@Injectable()
export class UserLocationsService {
  constructor(private readonly repository: UserLocationsRepository) {}

  async list(userId: string): Promise<{ items: PublicUserLocation[] }> {
    return { items: await this.repository.list(userId) };
  }

  async create(
    userId: string,
    input: CreateUserLocationDto,
  ): Promise<PublicUserLocation> {
    const count = await this.repository.count(userId);
    if (count >= MAX_USER_LOCATIONS) {
      throw new AppError(
        409,
        "LOCATION_LIMIT_REACHED",
        `A user can have at most ${MAX_USER_LOCATIONS} locations`,
      );
    }

    const created = await this.repository.create(userId, input);
    return count === 0 || input.isDefault
      ? this.repository.setDefault(userId, created.id)
      : created;
  }

  async update(
    userId: string,
    locationId: string,
    input: UpdateUserLocationDto,
  ): Promise<PublicUserLocation> {
    const updated = await this.repository.update(userId, locationId, input);
    return input.isDefault
      ? this.repository.setDefault(userId, locationId)
      : updated;
  }

  setDefault(userId: string, locationId: string) {
    return this.repository.setDefault(userId, locationId);
  }

  async remove(userId: string, locationId: string): Promise<{ success: true }> {
    const result = await this.repository.remove(userId, locationId);
    if (result.deletedWasDefault && result.remainingId) {
      await this.repository.setDefault(userId, result.remainingId);
    }
    return { success: true };
  }
}
