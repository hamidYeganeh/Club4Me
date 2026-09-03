import { Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import { ResourcesService } from "../resources/resources.service";
import { MediaService } from "../media/media.service";
import type { CreateClubDto } from "./dto/create-club.dto";
import type { ClubFields } from "./dto/club-fields.dto";
import type { UpdateClubDto } from "./dto/update-club.dto";
import type { PublicClub } from "./mappers/club.mapper";
import { ClubsRepository } from "./clubs.repository";

@Injectable()
export class ClubsService {
  constructor(
    private readonly repository: ClubsRepository,
    private readonly resources: ResourcesService,
    private readonly media: MediaService,
  ) {}

  async list(ownerId: string): Promise<{ items: PublicClub[] }> {
    return { items: await this.repository.listForOwner(ownerId) };
  }

  get(ownerId: string, clubId: string): Promise<PublicClub> {
    return this.repository.findForOwner(ownerId, clubId);
  }

  async listForAdmin(): Promise<{ items: PublicClub[] }> {
    return { items: await this.repository.listForAdmin() };
  }

  getForAdmin(clubId: string): Promise<PublicClub> {
    return this.repository.findById(clubId);
  }

  getPublic(clubId: string): Promise<PublicClub> {
    return this.repository.findPublic(clubId);
  }

  async getPublicDetails(clubId: string) {
    const club = await this.repository.findPublic(clubId);
    const media = await this.media.getReadyByIds(
      club.gallery.map((item) => item.mediaId),
    );
    const byId = new Map(media.map((item) => [item.id, item]));
    return {
      ...club,
      gallery: club.gallery.flatMap((item) => {
        const found = byId.get(item.mediaId);
        return found
          ? [{ ...item, url: found.url, mimeType: found.mimeType }]
          : [];
      }),
    };
  }

  async create(ownerId: string, input: CreateClubDto): Promise<PublicClub> {
    await this.validateReferences(input);
    await this.media.assertOwnedReady(
      ownerId,
      (input.gallery ?? []).map((item) => item.mediaId),
    );
    return this.repository.create(ownerId, input);
  }

  async update(
    ownerId: string,
    clubId: string,
    input: UpdateClubDto,
  ): Promise<PublicClub> {
    await this.validateReferences(input);
    await this.media.assertOwnedReady(
      ownerId,
      (input.gallery ?? []).map((item) => item.mediaId),
    );
    return this.repository.update(ownerId, clubId, input);
  }

  async submit(ownerId: string, clubId: string): Promise<PublicClub> {
    const club = await this.repository.findForOwner(ownerId, clubId);
    const missing = [
      !club.description && "description",
      club.gallery.length === 0 && "gallery",
      club.clubTypeIds.length === 0 && "clubTypeIds",
      !club.location && "location",
      club.cancellationRules.length === 0 && "cancellationRules",
    ].filter((field): field is string => Boolean(field));
    if (missing.length) {
      throw new AppError(
        400,
        "CLUB_PROFILE_INCOMPLETE",
        "Club profile is incomplete",
        { missing },
      );
    }
    return this.repository.submit(ownerId, clubId);
  }

  review(
    clubId: string,
    status: "approved" | "rejected",
    reason?: string,
  ): Promise<PublicClub> {
    return this.repository.review(clubId, status, reason);
  }

  private async validateReferences(input: Partial<ClubFields>): Promise<void> {
    await Promise.all([
      ...(input.clubTypeIds ?? []).map((id) =>
        this.resources.requireActive("sports", "club-type", id),
      ),
      ...(input.equipment ?? []).map((item) =>
        this.resources.requireActive(
          "facilities",
          "equipment",
          item.resourceId,
        ),
      ),
      ...(input.amenities ?? []).map((item) =>
        this.resources.requireActive("facilities", "amenity", item.resourceId),
      ),
    ]);

    if (!input.location) return;
    const {
      countryId,
      provinceId,
      cityId,
      districtId,
      cityRegionIds = [],
    } = input.location;
    const [, province, city, district, regions] = await Promise.all([
      this.resources.requireActive("location", "country", countryId),
      this.resources.requireActive("location", "province", provinceId),
      this.resources.requireActive("location", "city", cityId),
      districtId
        ? this.resources.requireActive("location", "district", districtId)
        : Promise.resolve(undefined),
      Promise.all(
        cityRegionIds.map((id) =>
          this.resources.requireActive("location", "city-region", id),
        ),
      ),
    ]);

    if (
      province.countryId !== countryId ||
      city.provinceId !== provinceId ||
      (district && district.cityId !== cityId) ||
      regions.some((region) => region.cityId !== cityId)
    ) {
      throw new AppError(
        400,
        "CLUB_LOCATION_HIERARCHY_INVALID",
        "Club location hierarchy is invalid",
      );
    }
  }
}
