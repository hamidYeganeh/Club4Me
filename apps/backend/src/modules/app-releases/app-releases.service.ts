import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../lib/errors";
import type { UserRole } from "../../lib/roles";
import {
  APP_PLATFORMS,
  compareAppVersions,
  isAppVersion,
  type AppPlatform,
} from "./app-version";
import type { SaveAppReleaseDto } from "./dto/save-app-release.dto";
import {
  AppRelease,
  type AppReleaseDocument,
} from "./schemas/app-release.schema";

@Injectable()
export class AppReleasesService {
  constructor(
    @InjectModel(AppRelease.name)
    private readonly releases: Model<AppReleaseDocument>,
  ) {}

  async getCurrent(platform: string, currentVersion: string) {
    assertPlatform(platform);
    if (!isAppVersion(currentVersion)) {
      throw new AppError(400, "INVALID_APP_VERSION", "Invalid app version");
    }

    const release = await this.releases
      .findOne({ platform, active: true })
      .lean();
    if (!release) return { configured: false as const, platform };

    const updateMode =
      compareAppVersions(currentVersion, release.minimumSupportedVersion) < 0
        ? "required"
        : compareAppVersions(currentVersion, release.latestVersion) < 0
          ? "optional"
          : "none";

    return {
      configured: true as const,
      ...serializeRelease(release),
      currentVersion,
      updateMode,
    };
  }

  async list(roles: UserRole[]) {
    assertAdmin(roles);
    const releases = await this.releases.find().sort({ platform: 1 }).lean();
    return { items: releases.map(serializeRelease) };
  }

  async save(
    roles: UserRole[],
    actorId: string,
    platform: string,
    input: SaveAppReleaseDto,
  ) {
    assertAdmin(roles);
    assertPlatform(platform);
    const release = await this.releases
      .findOneAndUpdate(
        { platform },
        {
          $set: {
            ...input,
            platform,
            publishedAt: new Date(),
            updatedBy: new Types.ObjectId(actorId),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean();
    return serializeRelease(release!);
  }
}

function assertPlatform(value: string): asserts value is AppPlatform {
  if (!(APP_PLATFORMS as readonly string[]).includes(value)) {
    throw new AppError(400, "INVALID_APP_PLATFORM", "Invalid app platform");
  }
}

function assertAdmin(roles: UserRole[]) {
  if (!roles.includes("admin")) {
    throw new AppError(403, "FORBIDDEN", "Admin access required");
  }
}

function serializeRelease(release: Record<string, any>) {
  return {
    id: String(release._id),
    platform: release.platform as AppPlatform,
    latestVersion: release.latestVersion,
    minimumSupportedVersion: release.minimumSupportedVersion,
    title: release.title,
    releaseNotes: release.releaseNotes ?? [],
    storeUrl: release.storeUrl,
    active: release.active,
    maintenanceEnabled: release.maintenanceEnabled ?? false,
    maintenanceTitle: release.maintenanceTitle ?? "در حال به‌روزرسانی سرویس",
    maintenanceMessage:
      release.maintenanceMessage ?? "چند دقیقه دیگر دوباره تلاش کنید.",
    featureFlags: release.featureFlags ?? {},
    publishedAt: release.publishedAt?.toISOString?.() ?? release.publishedAt,
    updatedAt: release.updatedAt?.toISOString?.() ?? release.updatedAt,
  };
}
