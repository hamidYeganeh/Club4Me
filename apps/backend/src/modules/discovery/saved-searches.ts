import { createHash } from "node:crypto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { z } from "zod";
import { userFeatureWrite } from "../../lib/user-feature-write";
import { parse } from "../../lib/validate";
import { AppError } from "../../common/errors/app.exception";
import { AppConfigService } from "../../config/app-config.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { NotificationsService } from "../notifications/notifications.service";
import { DiscoveryFeedService } from "./discovery.service";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
const numeric = z.string().regex(/^\d+(\.\d+)?$/);
export const savedSearchSchema = z.object({
  title: z.string().trim().min(1).max(80),
  alerts: z.boolean(),
  filters: z
    .object({
      q: z.string().trim().max(100).optional(),
      kind: z.enum(["club", "coach", "class"]).optional(),
      minPrice: numeric.optional(),
      maxPrice: numeric.optional(),
      latitude: z
        .string()
        .refine((v) => Number.isFinite(Number(v)) && Math.abs(Number(v)) <= 90)
        .optional(),
      longitude: z
        .string()
        .refine((v) => Number.isFinite(Number(v)) && Math.abs(Number(v)) <= 180)
        .optional(),
      radiusKm: numeric.optional(),
      skillLevelId: idSchema.optional(),
      cityId: idSchema.optional(),
      districtId: idSchema.optional(),
      cityRegionId: idSchema.optional(),
      sportId: idSchema.optional(),
      clubTypeId: idSchema.optional(),
      amenityId: idSchema.optional(),
      equipmentId: idSchema.optional(),
      coachId: idSchema.optional(),
      clubId: idSchema.optional(),
      categoryId: idSchema.optional(),
      sort: z.enum(["newest", "rating"]).optional(),
      serviceMode: z.enum(["club", "online", "home", "outdoor"]).optional(),
      admission: z.enum(["automatic", "requires_approval"]).optional(),
      startsFrom: z.string().date().optional(),
      startsTo: z.string().date().optional(),
      timeFrom: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .optional(),
      timeTo: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .optional(),
    })
    .refine(
      (v) =>
        v.minPrice === undefined ||
        v.maxPrice === undefined ||
        Number(v.minPrice) <= Number(v.maxPrice),
      "بودجه معتبر نیست",
    ),
});
type SavedSearch = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  alerts: boolean;
  filters: Record<string, string>;
  seen: string[];
  createdAt: Date;
  checkedAt: Date;
  nextCheckAt: Date;
};
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 24);

@Injectable()
export class SavedSearchesService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(SavedSearchesService.name);
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly discovery: DiscoveryFeedService,
    private readonly notifications: NotificationsService,
    private readonly config: AppConfigService,
  ) {}
  private get rows() {
    return this.db.collection<SavedSearch>("saved_discovery_searches");
  }
  async onModuleInit() {
    await this.rows.createIndex({ alerts: 1, nextCheckAt: 1 });
    await this.rows.createIndex({ userId: 1, createdAt: -1 });
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => {
      void this.scan().catch(() =>
        this.logger.warn("Saved search check failed; will retry"),
      );
    }, 60_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async list(userId: string) {
    const rows = await this.rows
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    return {
      items: rows.map(({ _id, title, alerts, filters, checkedAt }) => ({
        id: String(_id),
        title,
        alerts,
        filters,
        checkedAt,
      })),
    };
  }
  async save(userId: string, body: unknown) {
    const input = parse(savedSearchSchema, body);
    const filters = Object.fromEntries(
      Object.entries(input.filters)
        .filter(
          (entry): entry is [string, string] =>
            typeof entry[1] === "string" && entry[1] !== "",
        )
        .sort(([a], [b]) => a.localeCompare(b)),
    );
    const owner = new Types.ObjectId(userId);
    const _id = new Types.ObjectId(
      digest(`${userId}:${JSON.stringify(filters)}`),
    );
    const seen = await this.matches(filters);
    const now = new Date();
    await userFeatureWrite(
      this.db,
      userId,
      "saved-searches",
      async (session) => {
        const existing = await this.rows.findOne(
          { _id, userId: owner },
          { session },
        );
        if (
          !existing &&
          (await this.rows.countDocuments({ userId: owner }, { session })) >= 20
        )
          throw new AppError(
            400,
            "SAVED_SEARCH_LIMIT",
            "حداکثر ۲۰ جست‌وجو نگه دارید؛ ابتدا یکی را حذف کنید.",
          );
        await this.rows.updateOne(
          { _id, userId: owner },
          {
            $set: {
              ...input,
              filters,
              seen,
              checkedAt: now,
              nextCheckAt: new Date(+now + 15 * 60_000),
            },
            $setOnInsert: { userId: owner, createdAt: now },
          },
          { upsert: true, session },
        );
      },
    );
    return { id: String(_id) };
  }
  async remove(userId: string, key: string) {
    await this.rows.deleteOne({
      _id: new Types.ObjectId(parse(idSchema, key)),
      userId: new Types.ObjectId(userId),
    });
    return { success: true };
  }
  private async matches(filters: Record<string, string>) {
    const result = await this.discovery.searchPublicCatalog({
      ...filters,
      limit: "100",
      page: "1",
      sort: "newest",
    });
    return [
      ...result.clubs.map((x) => `club:${x.id}`),
      ...result.coaches.map((x) => `coach:${x.id}`),
      ...result.classes.map((x) => `class:${x.id}`),
      ...result.businessClasses.map((x) => `business:${x.id}`),
    ];
  }
  async scan() {
    // Claim work in MongoDB so multiple API/worker instances do not scan the same subscription.
    for (let count = 0; count < 20; count++) {
      const row = await this.rows.findOneAndUpdate(
        { alerts: true, nextCheckAt: { $lte: new Date() } },
        { $set: { nextCheckAt: new Date(Date.now() + 15 * 60_000) } },
        { sort: { nextCheckAt: 1 }, returnDocument: "before" },
      );
      if (!row) break;
      try {
        const matches = await this.matches(row.filters);
        const fresh = matches.filter((key) => !row.seen.includes(key));
        if (
          fresh.length &&
          (await this.rows.findOne({ _id: row._id, alerts: true }))
        ) {
          const params = new URLSearchParams({
            ...row.filters,
            nearby: row.filters.latitude ? "1" : "0",
          });
          await this.notifications.notifyDiscoveryMatch({
            userId: row.userId,
            key: digest(`${row._id}:${fresh.sort().join(",")}`),
            title: row.title,
            count: fresh.length,
            href: `/discovery/search?${params}`,
          });
        }
        await this.rows.updateOne(
          { _id: row._id, checkedAt: row.checkedAt },
          {
            $set: {
              seen: [...new Set([...row.seen, ...matches])].slice(-2000),
              checkedAt: new Date(),
            },
          },
        );
      } catch {
        this.logger.warn(
          "A saved search could not be refreshed; retained previous matches",
        );
      }
    }
  }
}

@Controller("api/v1/discovery/saved-searches")
@UseGuards(JwtAuthGuard)
export class SavedSearchesController {
  constructor(private readonly service: SavedSearchesService) {}
  @Get() list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.list(user.sub);
  }
  @Post() save(@CurrentUser() user: AuthTokenPayload, @Body() body: unknown) {
    return this.service.save(user.sub, body);
  }
  @Delete(":id") remove(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
  ) {
    return this.service.remove(user.sub, id);
  }
}
